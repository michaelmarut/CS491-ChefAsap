import React, { useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ScrollView, Text, Alert, View, FlatList } from "react-native";

import getEnvVars from "../config";
import { useAuth } from "./context/AuthContext";

import LoadingIcon from "./components/LoadingIcon";
import Button from "./components/Button";
import Card from "./components/Card";
import ChefMenuItem from './components/ChefMenuItem';

export default function ChefMenu() {
    const { token, userId, profileId } = useAuth();
    const { apiUrl } = getEnvVars();

    const [chefData, setChefData] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [newItemDraft, setNewItemDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleItemUpdate = (itemId, actionType) => {
        if (actionType === 'DELETE') {
            setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
            setFeaturedItems(prevFeatured => prevFeatured.filter(item => item.id !== itemId));

        } else if (actionType === 'POST_SUCCESS') {
            setNewItemDraft(null);
            refetchMenuData();

        } else if (actionType === 'PUT' || actionType === 'FEATURED_UPDATE') {
            return;
            refetchMenuData();
        }
    };

    const startNewItemDraft = () => {
        const tempId = -Date.now();

        const blankItem = {
            id: tempId,
            chef_id: profileId,
            dish_name: '',
            description: '',
            photo_url: null,
            servings: 1,
            cuisine_type: null,
            dietary_info: null,
            spice_level: null,
            display_order: menuItems.length,
            price: 0.00,
            prep_time: 15,
            is_new_draft: true,
        };
        setNewItemDraft(blankItem);
    };

    const refetchMenuData = async () => {
        if (!profileId) return;

        setLoading(true);
        setError(null);

        try {
            // Fetch chef profile
            const profileUrl = `${apiUrl}/profile/chef/${profileId}/public`;
            const profileResponse = await fetch(profileUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const profileData = await profileResponse.json();

            if (profileResponse.ok) {
                setChefData(profileData.profile);
            } else {
                setError(profileData.error || 'Failed to load profile.');
                Alert.alert('Error', profileData.error || 'Failed to load profile.');
            }

            // Fetch menu items
            const menuUrl = `${apiUrl}/api/menu/chef/${profileId}?show_all=true`;
            const menuResponse = await fetch(menuUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const menuData = await menuResponse.json();

            if (menuResponse.ok) {
                setMenuItems(menuData.menu_items || []);
            } else {
                setMenuItems([]);
            }

        } catch (err) {
            setError('Network error. Could not connect to API.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetchMenuData();
    }, [profileId, apiUrl, token]);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-12">
                {/*<Text>{JSON.stringify(chefData)}</Text>*/}
                <Card
                    title="Menu"
                    customHeader='justify-center'
                    customHeaderText='text-xl'
                >
                    {loading ?
                        <LoadingIcon message="Loading Your Menu..." icon='spinner' />
                        : <>
                            {console.log(chefData.cuisines)}
                            {menuItems.length > 0 ?
                                menuItems.map(item => (
                                    <ChefMenuItem
                                        key={item.id}
                                        item={item}
                                        onItemUpdate={handleItemUpdate}
                                        cuisineTypes={chefData?.cuisines || []}
                                    />
                                )) :
                                <Text className="text-primary-400 text-center py-4 dark:text-dark-400">
                                    No menu items available yet
                                </Text>}
                            {newItemDraft ? (
                                <ChefMenuItem
                                    key={newItemDraft.id}
                                    item={newItemDraft}
                                    onItemUpdate={handleItemUpdate}
                                    isNewDraft={true}
                                    onCancelNew={() => setNewItemDraft(null)}
                                />
                            ) : (
                                <Button
                                    title={newItemDraft ? "Cancel Add Item" : "Add New Menu Item"}
                                    onPress={newItemDraft ? () => setNewItemDraft(null) : startNewItemDraft}
                                    style={newItemDraft ? "danger" : "secondary"}
                                    customClasses="min-w-[60%]"
                                />
                            )}
                        </>
                    }
                </Card>

                <Button
                    title="Customer View"
                    style="primary"
                    customClasses="min-w-[60%]"
                    href={`/ChefMenu/${profileId}`}
                />

                <Button
                    title="← Return"
                    style="secondary"
                    href={`/(tabs)/Profile`}
                    customClasses="min-w-[60%]"
                />
                <View className="h-24" />

            </ScrollView>
        </>
    );
}