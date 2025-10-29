import React, { useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ScrollView, Text, Alert, View, FlatList } from "react-native";
import { Octicons } from '@expo/vector-icons';

import getEnvVars from "../config";
import { useAuth } from "./context/AuthContext";

import LoadingIcon from "./components/LoadingIcon";
import Button from "./components/Button";
import ProfilePicture from "./components/ProfilePicture";
import Card from "./components/Card";
import TagsBox from './components/TagsBox';
import RatingsDisplay from './components/RatingsDisplay';

const menuItemCard = ({ item }) => (
    <View className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mb-4 w-full" key={item?.id}>
        <View className="flex-row">
            <View className="flex w-1/2 justify-between pr-2">
                <Text className="text-lg font-medium pt-2 mb-2 text-center text-justified text-primary-400 dark:text-dark-400 w-full border-b border-primary-400 dark:border-dark-400">
                    {item?.dish_name || 'Dish Name'}
                </Text>
                <Text className="text-primary-400 text-md pt-2 mb-2 text-center text-justified dark:text-dark-400">
                    {item?.description || 'No description available'}
                </Text>
                {item?.servings && (
                    <Text className="text-primary-400 text-xs pt-2 mb-2 text-center text-justified dark:text-dark-400">
                        Servings: {item.servings}
                    </Text>
                )}
                {item?.spice_level && (
                    <Text className="text-primary-400 text-xs pt-2 mb-2 text-center text-justified dark:text-dark-400">
                        Spice: {item.spice_level}
                    </Text>
                )}
            </View>
            <View className="flex w-1/2">
                {item?.photo_url ? (
                    <View className="bg-white h-[150px] justify-center">
                        <Text className="text-lg text-center text-primary-400 dark:text-dark-400">IMAGE: {item.photo_url}</Text>
                    </View>
                ) : (
                    <View className="bg-white h-[150px] justify-center">
                        <Text className="text-lg text-center text-primary-400 dark:text-dark-400">NO IMAGE</Text>
                    </View>
                )}
            </View>
        </View>

        {item?.cuisine_type && (
            <Text className="text-primary-400 text-sm pt-2 mb-2 text-center text-justified dark:text-dark-400">
                {item.cuisine_type}
            </Text>
        )}
        {item?.dietary_info && (
            <Text className="text-primary-400 text-xs pt-2 mb-2 text-center text-justified dark:text-dark-400">
                {item.dietary_info}
            </Text>
        )}
        <Button
            title={item?.is_available ? "Make Unavailable" : "Make Available"}
            onPress={() => alert(item?.is_available ? "Made Unavailable" : "Made Available")}
            customClasses='rounded-xl'
            customTextClasses='text-sm'
            style='secondary'
        />
        <Button
            title={"Edit item"}
            onPress={() => alert("Edit mode")}
            customClasses='rounded-xl'
            customTextClasses='text-sm'
        />
    </View>
);

const timing = ["Lunch", "Dinner"];
const cuisine = ["Gluten-Free", "Italian", "Vegetarian", "Vietnamese"];
const distance = 3.1

export default function ChefMenu() {
    const { id } = useLocalSearchParams();

    const { token, userId, profileId } = useAuth();
    const { apiUrl } = getEnvVars();

    const [chefData, setChefData] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [featuredItems, setFeaturedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
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
                const menuUrl = `${apiUrl}/api/menu/chef/${profileId}`;
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
                    console.log('Menu items loaded:', menuData.menu_items?.length || 0);
                } else {
                    console.log('Menu fetch error:', menuData.error);
                    setMenuItems([]);
                }

                // Fetch featured items
                const featuredUrl = `${apiUrl}/api/menu/chef/${profileId}/featured`;
                const featuredResponse = await fetch(featuredUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const featuredData = await featuredResponse.json();

                if (featuredResponse.ok) {
                    setFeaturedItems(featuredData.featured_items || []);
                    console.log('Featured items loaded:', featuredData.featured_items?.length || 0);
                } else {
                    console.log('Featured items fetch error:', featuredData.error);
                    setFeaturedItems([]);
                }

            } catch (err) {
                setError('Network error. Could not connect to API.');
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [profileId, apiUrl, token]);

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100">
                    <LoadingIcon message="Loading Chef Menu..." />
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-12">
                {/*<Text>{JSON.stringify(chefData)}</Text>*/}
                {menuItems.length > 0 ? (
                    <Card
                        title="All Menu Items"
                        customHeader='justify-center'
                        customHeaderText='text-xl'
                    >
                        {menuItems.map(item => menuItemCard({ item }))}
                    </Card>
                ) : (
                    <Card
                        title="Menu"
                        isCollapsible={true}
                        customHeader='justify-center'
                    >
                        <Text className="text-primary-400 text-center py-4 dark:text-dark-400">
                            No menu items available yet
                        </Text>
                    </Card>
                )}

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