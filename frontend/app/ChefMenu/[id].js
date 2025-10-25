import React, { useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ScrollView, Text, Alert, View, FlatList } from "react-native";
import { Octicons } from '@expo/vector-icons';

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import LoadingIcon from "../components/LoadingIcon";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import Card from "../components/Card";
import TagsBox from '../components/TagsBox';
import RatingsDisplay from '../components/RatingsDisplay';

const tempFeatureComponent = (
    <View className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mr-4 " >
        <View className="bg-white h-[100px] w-[100px] justify-center">
            <Text className="text-lg text-center text-primary-400 dark:text-dark-400">IMAGE GOES HERE</Text>
        </View>
        <Text className="text-primary-400 text-md pt-2 mb-2 w-[100px] text-center text-justified dark:text-dark-400">
            Food Name
        </Text>
        <Button
            title={"Add to order"}
            onPress={() => alert("Added to order")}
            customClasses='rounded-xl'
            customTextClasses='text-sm'
        />
    </View>
);

const tempMenuComponent = ({ item }) => (
    <View className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mb-4 w-[48%]">
        <View className="bg-white h-[100px] w-full justify-center">
            <Text className="text-lg text-center text-primary-400 dark:text-dark-400">IMAGE GOES HERE</Text>
        </View>
        <Text className="text-primary-400 text-md pt-2 mb-2 w-full text-center text-justified dark:text-dark-400">
            {item?.name || 'Food Name'}
        </Text>
        <Button
            title={"Add to order"}
            onPress={() => alert("Added to order")}
            customClasses='rounded-xl'
            customTextClasses='text-sm'
        />
    </View>
);

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
            title={item?.is_available ? "Add to order" : "Not available"}
            onPress={() => item?.is_available && alert("Added to order")}
            customClasses='rounded-xl'
            customTextClasses='text-sm'
            disabled={!item?.is_available}
        />
    </View>
);

const tempOptionsList = {
    'Fruits': [
        { id: 'f1', name: 'Apple', desc: 'A sweet red fruit picked straight from a local tree', price: 2.99, preptime: 20 },
        { id: 'f2', name: 'Banana', desc: 'A sweet red fruit', price: 2.99, preptime: 10 },
        { id: 'f3', name: 'Grape', desc: 'A sweet red fruit', price: 5.99, preptime: 20 },
        { id: 'f4', name: 'Orange', desc: 'A sweet red fruit', price: 10.99, preptime: 30 },
    ],
    'Vegetables': [
        { id: 'v1', name: 'Carrot', desc: 'A sweet red fruit', price: 2.99, preptime: 10 },
        { id: 'v2', name: 'Broccoli', desc: 'A sweet red fruit', price: 5.99, preptime: 20 },
        { id: 'v3', name: 'Spinach', desc: 'A sweet red fruit', price: 6.99, preptime: 10 },
        { id: 'v4', name: 'Cabbage', desc: 'A sweet red fruit', price: 7.99, preptime: 40 },
        { id: 'v5', name: 'Peppers', desc: 'A sweet red fruit', price: 9.99, preptime: 10 },
        { id: 'v6', name: 'Cucumber', desc: 'A sweet red fruit', price: 10.99, preptime: 50 },
    ],
};

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
        if (!id) return;

        const chefId = parseInt(id, 10);

        console.log(`Fetching menu data for Chef ID: ${chefId}`);

        const fetchData = async () => {
            if (!chefId) return;

            setLoading(true);
            setError(null);

            try {
                // Fetch chef profile
                const profileUrl = `${apiUrl}/profile/chef/${chefId}/public`;
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
                const menuUrl = `${apiUrl}/api/menu/chef/${chefId}`;
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
                const featuredUrl = `${apiUrl}/api/menu/chef/${chefId}/featured`;
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

    }, [id, apiUrl, token]);

    const renderGridItem = ({ item }) => (
        tempMenuComponent({ item })
    );

    if (loading) {
        return (
            <View className="flex-1 bg-base-100 dark:bg-base-dark-100 pb-16 items-center justify-center">
                <LoadingIcon message='Loading Chef Menu...' />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-12">
                {/*<Text>{JSON.stringify(chefData)}</Text>*/}
                <View className="flex justify-center items-center bg-primary-100 dark:bg-dark-100 rounded-3xl mb-4 border-2 shadow-sm shadow-primary-500 border-primary-100 dark:border-dark-100">
                    <View className="flex-row w-full justify-between items-center p-2 pl-4 pr-4">
                        <Text className="text-3xl font-bold text-primary-400 text-center dark:text-dark-400">{chefData?.first_name} {chefData?.last_name}</Text>
                        <Text className="text-md text-primary-400 dark:text-dark-400">{distance} Mi.</Text>
                    </View>


                    <View className="flex-row w-full justify-between bg-base-100 dark:bg-base-dark-100 border-t-2 border-primary-300 dark:border-dark-300">
                        <View className="flex justify-center items-center w-1/2 bg-primary-100 pt-2 pl-4 pr-4 dark:bg-dark-100">
                            <TagsBox words={cuisine} />
                            <Text className="text-md text-primary-400 pt-2 dark:text-dark-400">Available:</Text>
                            <Text className="text-md text-primary-400 pb-2 dark:text-dark-400">{timing?.join(', ')}</Text>
                        </View>
                        <View className="flex justify-center items-center w-1/2 p-4 rounded-br-3xl">
                            <ProfilePicture photoUrl={chefData?.photo_url} firstName={chefData?.first_name} lastName={chefData?.last_name} size={28} />
                            <RatingsDisplay rating={chefData?.average_rating} />
                        </View>
                    </View>
                    <Text className="text-sm text-center text-primary-400 dark:text-dark-400 py-2 border-t-2 border-primary-300 dark:border-dark-300 w-full">Last Updated: {chefData?.member_since}</Text>
                </View>

                <Card
                    title="Featured Dishes"
                    customHeader='justify-center'
                    customHeaderText='text-xl'
                    isScrollable={true}
                    customCard=""
                    isCollapsible={true}
                    startExpanded={true}
                >
                    {featuredItems.length > 0 ? (
                        featuredItems.map(item => menuItemCard({ item }))
                    ) : (
                        <Text className="text-primary-400 text-center py-4 dark:text-dark-400">
                            No featured dishes available
                        </Text>
                    )}
                </Card>

                {menuItems.length > 0 ? (
                    <Card
                        title="All Menu Items"
                        isCollapsible={true}
                        customHeader='justify-center'
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
                    title="View Order"
                    style="primary"
                    customClasses="min-w-[60%]"
                    onPress={() => alert("Checkout Placeholder")}
                />

                <Button
                    title="← Return"
                    style="secondary"
                    href={`/ChefProfileScreen/${id}`}
                    customClasses="min-w-[60%]"
                />
                <View className="h-24" />
            </ScrollView>
        </>
    );
}