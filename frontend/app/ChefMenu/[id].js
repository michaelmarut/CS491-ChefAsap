import React, { useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
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

const menuItemCard = ({ item, onAddToOrder }) => (
    <View className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mb-4 w-full" key={item?.id}>
        <Text className="text-lg font-medium mb-2 text-center text-justified text-primary-400 dark:text-dark-400 w-full border-b border-primary-400 dark:border-dark-400">
            {item?.dish_name || 'Dish Name'}
        </Text>
        <View className="flex-row border-b border-primary-400 dark:border-dark-400 pb-2">
            <View className="flex w-1/2 justify-between pr-2">
                <TagsBox words={[].concat(item?.cuisine_type, item?.dietary_info)} style='light' />
                <Text className="text-primary-400 text-md pt-1 mb-1 text-center text-justified dark:text-dark-400">
                    {item?.description || 'No description available'}
                </Text>
                {item?.servings && (
                    <Text className="text-primary-400 text-xs pt-1 text-center text-justified dark:text-dark-400">
                        Servings: {item.servings}
                    </Text>
                )}
                {item?.spice_level && (
                    <Text className="text-primary-400 text-xs mb-1 text-center text-justified dark:text-dark-400">
                        Spice Level: {item.spice_level}
                    </Text>
                )}
            </View>
            <View className="flex w-1/2 justify-center">
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

        <View className="flex-row justify-between items-center p-2">
        {item?.prep_time && (
            <Text className="text-primary-400 text-nd font-medium text-center text-justified dark:text-dark-400">
                Prep time: {item.prep_time} min
            </Text>
        )}
        {item?.price && (
            <Text className="text-primary-400 text-xl font-medium text-center dark:text-dark-400 pr-2">
                ${item.price.toFixed(2)}
            </Text>
        )}
        </View>
        <Button
            title={item?.is_available ? "Add to order" : "Not available"}
            onPress={() => onAddToOrder && onAddToOrder(item)}
            customClasses='rounded-xl'
            customTextClasses='text-sm'
            disabled={!item?.is_available}
        />
    </View>
);

const timing = ["Lunch", "Dinner"];
const cuisine = ["Gluten-Free", "Italian", "Vegetarian", "Vietnamese"];
const distance = 3.1

export default function ChefMenu() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const { token, userId, profileId, userType } = useAuth();
    const { apiUrl } = getEnvVars();

    const [chefData, setChefData] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [featuredItems, setFeaturedItems] = useState([]);
    const [chefCuisines, setChefCuisines] = useState([]);
    const [mealTimings, setMealTimings] = useState([]);
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
                    setChefCuisines(profileData.profile.cuisines || []);
                    setMealTimings(profileData.profile.meal_timings || ['Breakfast', 'Lunch', 'Dinner']);

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

    // Handle adding item to order
    const handleAddToOrder = (item) => {
        if (!item.is_available) {
            Alert.alert('Not Available', 'This dish is currently not available.');
            return;
        }

        Alert.alert(
            'Item Info',
            `${item.dish_name} - $${item.price ? item.price.toFixed(2) : 'N/A'}`
        );
    };

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
                <View className="flex justify-center items-center bg-primary-100 dark:bg-dark-100 rounded-3xl mb-4 border-2 shadow-sm shadow-primary-500 border-primary-100 dark:border-dark-100">
                    <View className="flex-row w-full justify-between items-center p-2 pl-4 pr-4">
                        <Text className="text-3xl font-bold text-primary-400 text-center dark:text-dark-400">{chefData?.first_name} {chefData?.last_name}</Text>
                        <Text className="text-md text-primary-400 dark:text-dark-400">{distance} Mi.</Text>
                    </View>


                    <View className="flex-row w-full justify-between bg-base-100 dark:bg-base-dark-100 border-t-2 border-primary-300 dark:border-dark-300">
                        <View className="flex justify-center items-center w-1/2 bg-primary-100 pt-2 pl-4 pr-4 dark:bg-dark-100">
                            <TagsBox words={chefCuisines} />
                            <Text className="text-md text-primary-400 pt-2 dark:text-dark-400">Serves:</Text>
                            <Text className="text-md text-primary-400 pb-2 dark:text-dark-400 text-center">{mealTimings?.join(', ')}</Text>
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
                        featuredItems.map(item => menuItemCard({ item, onAddToOrder: handleAddToOrder }))
                    ) : (
                        <Text className="text-primary-400 text-center py-4 dark:text-dark-400">
                            No featured dishes available
                        </Text>
                    )}
                </Card>

                {menuItems.length > 0 ? (
                    <Card
                        title="All Menu Items"
                        customHeader='justify-center'
                    >
                        {menuItems.map(item => menuItemCard({ item, onAddToOrder: handleAddToOrder }))}
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
                    disabled={userType === 'chef'}
                />
                <Button
                    title="← Return"
                    style="secondary"
                    href={userType === 'customer' ? `/ChefProfileScreen/${id}` : "/ChefMenuScreen"}
                    customClasses="min-w-[60%]"
                />
                <View className="h-24" />
            </ScrollView>
        </>
    );
}