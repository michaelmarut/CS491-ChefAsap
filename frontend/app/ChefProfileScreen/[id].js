import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ScrollView, Text, Alert, View, TouchableOpacity, TextInput, Image } from "react-native";
import { Octicons } from '@expo/vector-icons';

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import LoadingIcon from "../components/LoadingIcon";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import Card from "../components/Card";
import RatingsDisplay from '../components/RatingsDisplay';
import TagsBox from '../components/TagsBox';

const featuredDishComponent = (item, apiUrl) => (
    <View key={item.id} className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mr-4" >
        {item.photo_url ? (
            <Image 
                source={{ uri: `${apiUrl}${item.photo_url}` }}
                className="h-[200px] w-[200px] rounded-lg"
                resizeMode="cover"
            />
        ) : (
            <View className="bg-white h-[200px] w-[200px] justify-center rounded-lg">
                <Text className="text-lg text-center text-primary-400 dark:text-dark-400">NO IMAGE</Text>
            </View>
        )}
        <Text className="text-primary-400 text-md font-semibold pt-2 w-[200px] text-center dark:text-dark-400">
            {item.dish_name}
        </Text>
        <Text className="text-primary-400 text-sm pt-1 w-[200px] text-center text-justified dark:text-dark-400">
            {item.description || 'No description'}
        </Text>
        {item.cuisine_type && (
            <Text className="text-primary-400 text-xs pt-1 w-[200px] text-center dark:text-dark-400">
                {item.cuisine_type}
            </Text>
        )}
        {item.price && (
            <Text className="text-primary-400 text-lg font-bold pt-2 w-[200px] text-center dark:text-dark-400">
                ${item.price.toFixed(2)}
            </Text>
        )}
        {item.prep_time && (
            <Text className="text-primary-400 text-xs pt-1 w-[200px] text-center dark:text-dark-400">
                Prep time: {item.prep_time} min
            </Text>
        )}
    </View>
);

export default function ChefProfileScreen() {
    const { id } = useLocalSearchParams();

    const { token, userId, profileId, userType } = useAuth();
    const { apiUrl } = getEnvVars();

    const [chefData, setChefData] = useState(null);
    const [featuredItems, setFeaturedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingAbout, setEditingAbout] = useState(false);
    const [aboutText, setAboutText] = useState('');
    const [savingAbout, setSavingAbout] = useState(false);
    const [chefCuisines, setChefCuisines] = useState([]);
    const [mealTimings, setMealTimings] = useState([]);

    useEffect(() => {
        if (!id) return;

        const chefId = parseInt(id, 10);

        console.log(`Fetching profile data for Chef ID: ${chefId}`);

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
                    setAboutText(profileData.profile.description || '');
                    setChefCuisines(profileData.profile.cuisines || []);
                    setMealTimings(profileData.profile.meal_timings || ['Breakfast', 'Lunch', 'Dinner']);
                } else {
                    setError(profileData.error || 'Failed to load profile.');
                    Alert.alert('Error', profileData.error || 'Failed to load profile.');
                }

                // Fetch featured dishes (max 3 dishes marked as featured by chef)
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
                } else {
                    setFeaturedItems([]);
                }

                // Save chef view record (only for customers)
                if (userType === 'customer' && profileId) {
                    try {
                        const viewUrl = `${apiUrl}/search/viewed-chefs/${profileId}`;
                        await fetch(viewUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({ chef_id: chefId }),
                        });
                        console.log(`Saved view record for chef ${chefId}`);
                    } catch (viewError) {
                        console.error('Failed to save view record:', viewError);
                        // Don't show error to user, just log it
                    }
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

    const handleSaveAbout = async () => {
        if (aboutText.length > 500) {
            Alert.alert('Error', 'Description cannot exceed 500 characters');
            return;
        }

        setSavingAbout(true);
        try {
            const response = await fetch(`${apiUrl}/profile/chef/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ description: aboutText }),
            });

            const result = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'About section updated successfully');
                setChefData({ ...chefData, description: aboutText });
                setEditingAbout(false);
            } else {
                Alert.alert('Error', result.error || 'Failed to update');
            }
        } catch (error) {
            console.error('Failed to save about:', error);
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setSavingAbout(false);
        }
    };

    const handleCancelEdit = () => {
        setAboutText(chefData?.description || '');
        setEditingAbout(false);
    };

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100">
                    <LoadingIcon message="Loading Chef Profile..." />
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-12">
                {/*console.log(JSON.stringify(chefData))*/}
                <Card
                    title={`${chefData?.first_name} ${chefData?.last_name}`}
                    customHeader='justify-center'
                    customHeaderText='text-3xl'
                >
                    <ProfilePicture photoUrl={chefData?.photo_url} firstName={chefData?.first_name} lastName={chefData?.last_name} />
                    <RatingsDisplay rating={chefData?.average_rating} />
                    <Text className="text-lg text-center text-primary-400 pb-2 dark:text-dark-400">
                        {chefData.total_ratings} Total Reviews
                        <Button
                            icon='cross-reference'
                            base='link'
                            style='transparent'
                            customClasses='p-0 pl-2 pt-3'
                            onPress={() => alert("Reviews Placeholder")}
                        />
                    </Text>
                    <Text className="text-sm text-center text-primary-400 pt-2 border-t border-primary-200 dark:text-dark-400 dark:border-dark-200">Serving Since: {chefData.member_since}</Text>
                </Card>

                <Card>
                    <Text className="text-lg text-center text-primary-400 font-semibold dark:text-dark-400">Located in: {chefData.public_location} </Text>
                    <Text className="text-lg text-center text-primary-400 dark:text-dark-400">Distance from you: (1.5 mi. Away) </Text>
                </Card>

                <Card>
                    <Text className="text-lg text-primary-400 text-center font-semibold mb-3 dark:text-dark-400">
                        Chef Details
                    </Text>

                    {/* Meal Timings */}
                    {mealTimings.length > 0 && (
                        <View className="mb-3">
                            <Text className="text-md text-primary-400 font-semibold mb-2 dark:text-dark-400">
                                Serves:
                            </Text>
                            <Text className="text-md text-primary-400 font-semibold mb-2 dark:text-dark-400">
                                {mealTimings?.join(', ')}
                            </Text>
                        </View>
                    )}

                    {/* Cuisines */}
                    <View>
                        <Text className="text-md text-primary-400 font-semibold mb-2 dark:text-dark-400">
                            Cuisine Specialties:
                        </Text>
                        {chefCuisines.length > 0 ? (
                            <TagsBox words={chefCuisines} />
                        ) : (
                            <Text className="text-md text-center text-gray-500 dark:text-gray-400">
                                No cuisine specialties listed
                            </Text>
                        )}
                    </View>
                </Card>

                <Card
                    title="About"
                    customHeader='justify-center'
                    customHeaderText='text-xl'
                >
                    {/* Show edit button only if chef is viewing their own profile */}
                    {userType === 'chef' && profileId === parseInt(id, 10) && !editingAbout && (
                        <TouchableOpacity
                            onPress={() => setEditingAbout(true)}
                            className="absolute top-4 right-4 bg-lime-600 rounded-full p-2"
                        >
                            <Octicons name="pencil" size={18} color="white" />
                        </TouchableOpacity>
                    )}

                    {editingAbout ? (
                        <View>
                            <TextInput
                                className="border border-primary-200 dark:border-dark-200 rounded-lg p-3 text-primary-400 dark:text-dark-400 bg-white dark:bg-gray-800 min-h-[150px]"
                                multiline
                                numberOfLines={6}
                                value={aboutText}
                                onChangeText={setAboutText}
                                placeholder="Tell customers about yourself and your cooking..."
                                placeholderTextColor="#9CA3AF"
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            <Text className="text-sm text-right text-gray-500 mt-1 dark:text-gray-400">
                                {aboutText.length}/500
                            </Text>
                            <View className="flex-row justify-end gap-2 mt-3">
                                <TouchableOpacity
                                    onPress={handleCancelEdit}
                                    className="bg-gray-300 dark:bg-gray-600 px-4 py-2 rounded-full"
                                >
                                    <Text className="text-gray-700 dark:text-gray-200 font-semibold">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSaveAbout}
                                    disabled={savingAbout}
                                    className="bg-lime-600 px-4 py-2 rounded-full"
                                >
                                    <Text className="text-white font-semibold">
                                        {savingAbout ? 'Saving...' : 'Save'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <Text className="text-lg text-center text-primary-400 text-pretty dark:text-dark-400">
                            {chefData?.description || 'No description available'}
                        </Text>
                    )}
                </Card>

                <Card
                    title="Featured Dishes"
                    customHeader='justify-center'
                    customHeaderText='text-xl'
                    isScrollable={true}
                    scrollDirection='horizontal'
                    customCard="py-1"
                >
                    {loading ? (
                        <Text className="text-primary-400 text-center py-4 dark:text-dark-400">
                            Loading featured dishes...
                        </Text>
                    ) : featuredItems.length > 0 ? (
                        featuredItems.map(item => featuredDishComponent(item, apiUrl))
                    ) : (
                        <Text className="text-primary-400 text-center py-4 dark:text-dark-400">
                            No featured dishes available
                        </Text>
                    )}
                </Card>

                <Button
                    title="View Menu"
                    style="primary"
                    customClasses="min-w-[60%]"
                    href={`/ChefMenu/${id}`}
                />

                <Button
                    title="← Return"
                    style="secondary"
                    href={userType === 'customer' ? "/(tabs)/SearchScreen" : "/(tabs)/Profile"}
                    customClasses="min-w-[60%]"
                />
                <View className="h-24" />
            </ScrollView>
        </>
    );
}