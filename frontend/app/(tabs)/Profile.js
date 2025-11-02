import { useEffect, useState } from "react";
import { ScrollView, Text, View, Alert, TouchableOpacity, TextInput, Modal } from "react-native";

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import LoadingIcon from "../components/LoadingIcon";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import Card from "../components/Card";
import ThemeButton from "../components/ThemeButton";
import RatingsDisplay from "../components/RatingsDisplay";
import TagsBox from "../components/TagsBox";
import Input from "../components/Input";

import { Octicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const { logout, token, userType, userId, profileId } = useAuth();
    const { apiUrl } = getEnvVars();

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingAbout, setEditingAbout] = useState(false);
    const [aboutText, setAboutText] = useState('');
    const [savingAbout, setSavingAbout] = useState(false);
    const [editingDetails, setEditingDetails] = useState(false);
    const [allCuisines, setAllCuisines] = useState([]);
    const [selectedCuisines, setSelectedCuisines] = useState([]);
    const [selectedMealTimings, setSelectedMealTimings] = useState(['Lunch', 'Dinner']);
    const [savingDetails, setSavingDetails] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId || !token || !userType || !profileId) return;

            setLoading(true);
            setError(null);

            try {
                const url = `${apiUrl}/profile/${userType}/${profileId}`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    setProfileData(data.profile);
                    setAboutText(data.profile.description || '');
                    setSelectedCuisines(data.profile.cuisines || []);
                    setSelectedMealTimings(data.profile.meal_timings || ['Breakfast', 'Lunch', 'Dinner']);
                } else {
                    setError(data.error || 'Failed to load profile.');
                    Alert.alert('Error', data.error || 'Failed to load profile.');
                }
            } catch (err) {
                setError('Network error. Could not connect to API.');
                Alert.alert('Error', 'Network error. Could not connect to API.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [profileId, userId, userType, token, apiUrl]);

    useEffect(() => {
        // Fetch all available cuisines for chef users
        const fetchCuisines = async () => {
            if (userType !== 'chef') return;

            try {
                const response = await fetch(`${apiUrl}/profile/cuisines`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    setAllCuisines(data.cuisines || []);
                }
            } catch (error) {
                console.error('Failed to fetch cuisines:', error);
            }
        };

        fetchCuisines();
    }, [userType, apiUrl, token]);

    const handleSaveAbout = async () => {
        if (aboutText.length > 500) {
            Alert.alert('Error', 'Description cannot exceed 500 characters');
            return;
        }

        setSavingAbout(true);
        try {
            const response = await fetch(`${apiUrl}/profile/chef/${profileId}`, {
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
                setProfileData({ ...profileData, description: aboutText });
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
        setAboutText(profileData?.description || '');
        setEditingAbout(false);
    };

    const handleSaveDetails = async () => {
        setSavingDetails(true);
        try {
            // Save cuisines
            const cuisinesResponse = await fetch(`${apiUrl}/profile/chef/${profileId}/cuisines`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ cuisines: selectedCuisines }),
            });

            const cuisinesResult = await cuisinesResponse.json();

            if (!cuisinesResponse.ok) {
                Alert.alert('Error', cuisinesResult.error || 'Failed to update cuisines');
                setSavingDetails(false);
                return;
            }

            // Save meal timings
            const timingsResponse = await fetch(`${apiUrl}/profile/chef/${profileId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ meal_timings: selectedMealTimings }),
            });

            const timingsResult = await timingsResponse.json();

            if (timingsResponse.ok) {
                Alert.alert('Success', 'Chef details updated successfully');
                setProfileData({
                    ...profileData,
                    cuisines: selectedCuisines,
                    meal_timings: selectedMealTimings
                });
                setEditingDetails(false);
            } else {
                Alert.alert('Error', timingsResult.error || 'Failed to update meal timings');
            }
        } catch (error) {
            console.error('Failed to save details:', error);
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setSavingDetails(false);
        }
    };

    const handleCancelDetailsEdit = () => {
        setSelectedCuisines(profileData?.cuisines || []);
        setSelectedMealTimings(profileData?.meal_timings || ['Breakfast', 'Lunch', 'Dinner']);
        setEditingDetails(false);
    };

    const toggleCuisine = (cuisineName) => {
        setSelectedCuisines(prev => {
            if (prev.includes(cuisineName)) {
                return prev.filter(c => c !== cuisineName);
            } else {
                return [...prev, cuisineName];
            }
        });
    };

    const toggleMealTiming = (timing) => {
        setSelectedMealTimings(prev => {
            if (prev.includes(timing)) {
                return prev.filter(t => t !== timing);
            } else {
                return [...prev, timing];
            }
        });
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100">
                <LoadingIcon message="Loading Profile..." />
                <Button
                    title="Log out"
                    style="primary"
                    customClasses="min-w-[50%]"
                    onPress={logout}
                />
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100">
                <Text className="text-lg text-red-500">Error: {error}</Text>
                <Button
                    title="Log out"
                    style="primary"
                    customClasses="min-w-[50%]"
                    onPress={logout}
                />
            </View>
        );
    }


    return (
        <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-12">
            {/*console.log(JSON.stringify(profileData))*/}
            <Card
                title="Profile"
                headerIcon="person"
            >
                <Button
                    href="/ProfileSettings"
                    icon="gear"
                    style="accent"
                    customClasses="absolute -top-[70px] -right-2 z-10 p-3 rounded-full pl-3"
                />
                <ThemeButton />

                <ProfilePicture photoUrl={profileData?.photo_url} firstName={profileData?.first_name} lastName={profileData?.last_name} />
                <Text className="text-xl font-bold text-wrap text-center mb-1 mt-2 text-primary-400 dark:text-dark-400">{profileData?.first_name} {profileData?.last_name} </Text>
                <Text className="text-lg text-wrap text-center text-primary-400 dark:text-dark-400">{userType?.charAt(0).toUpperCase() + userType?.slice(1)}</Text>
                {userType === 'chef' && (
                    <>
                        <RatingsDisplay rating={profileData?.avg_rating} />
                        <Text className="text-lg text-center text-primary-400 pb-2 dark:text-dark-400">
                            {profileData?.total_reviews} Total Reviews
                            <Button
                                icon='cross-reference'
                                base='link'
                                style='transparent'
                                customClasses='p-0 pl-2 pt-3'
                                onPress={() => alert("Reviews Placeholder")}
                            />
                        </Text>
                    </>
                )}
                <Text className="text-sm text-center text-primary-400 pt-2 border-t border-primary-200 dark:text-dark-400 dark:border-dark-200">Member Since: {profileData?.member_since}</Text>
            </Card>

            {userType === "customer" ? (
                <>
                    <Card
                        title="Help & Policies"
                        headerIcon="info"
                    >
                        <Text className="text-lg text-wrap mb-1 mt-2 text-primary-400 dark:text-dark-400"> Help</Text>
                        <Text className="text-lg text-wrap mb-1 mt-2 text-primary-400 dark:text-dark-400"> Policies</Text>

                    </Card>
                </>
            ) : (
                <>
                    <Card
                        title="Chef Details"
                        customHeader='justify-center'
                        customHeaderText='text-xl'
                    >
                        {!editingDetails && (
                            <Button
                                onPress={() => setEditingDetails(true)}
                                icon="pencil"
                                style="accent"
                                customClasses="absolute -top-[70px] -right-2 z-10 p-3 rounded-full pl-3"
                            />
                        )}

                        {editingDetails ? (
                            <View>
                                <Text className="text-md font-semibold mb-2 text-primary-400 dark:text-dark-400">
                                    Meal Timings:
                                </Text>
                                <View className="flex-row flex-wrap gap-2 mb-4">
                                    {['Breakfast', 'Lunch', 'Dinner'].map((timing) => (
                                        <TouchableOpacity
                                            key={timing}
                                            onPress={() => toggleMealTiming(timing)}
                                            className={`px-4 py-2 rounded-full ${selectedMealTimings.includes(timing)
                                                ? 'bg-lime-600'
                                                : 'bg-gray-300 dark:bg-gray-600'
                                                }`}
                                        >
                                            <Text className={`${selectedMealTimings.includes(timing)
                                                ? 'text-white'
                                                : 'text-gray-700 dark:text-gray-200'
                                                }`}>
                                                {timing}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text className="text-md font-semibold mb-2 text-primary-400 dark:text-dark-400">
                                    Cuisines ({selectedCuisines.length} selected):
                                </Text>
                                <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    Tap to select/deselect cuisines. Scroll to see all options.
                                </Text>
                                <ScrollView className="max-h-[300px] mb-4 border border-primary-200 dark:border-dark-200 rounded-lg p-3">
                                    <View className="flex-row flex-wrap gap-2">
                                        {allCuisines.sort((a, b) => a.name.localeCompare(b.name)).map((cuisine) => (
                                            <TouchableOpacity
                                                key={cuisine.id}
                                                onPress={() => toggleCuisine(cuisine.name)}
                                                className={`px-3 py-1.5 rounded-full ${selectedCuisines.includes(cuisine.name)
                                                    ? 'bg-lime-600'
                                                    : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}
                                            >
                                                <Text className={`text-sm ${selectedCuisines.includes(cuisine.name)
                                                    ? 'text-white font-semibold'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {cuisine.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                                <Button
                                    onPress={handleCancelDetailsEdit}
                                    icon="x"
                                    style="accent"
                                    customClasses="absolute -top-[70px] right-10 z-10 p-3 rounded-full pl-3"
                                />
                                <Button
                                    onPress={handleSaveDetails}
                                    icon={savingDetails ? 'sync' : 'check'}
                                    style="accent"
                                    customClasses="absolute -top-[70px] -right-2 z-10 p-3 rounded-full pl-3"
                                    disabled={savingDetails}
                                />
                            </View>
                        ) : (
                            <>
                                <Text className="text-lg text-primary-400 text-center font-semibold mb-2 dark:text-dark-400">
                                    Serves: {selectedMealTimings.join(', ')}
                                </Text>
                                <View className="flex-row flex-wrap justify-center items-center w-full gap-1">
                                    {profileData?.cuisines && profileData.cuisines.length > 0 ? (
                                        <TagsBox words={profileData?.cuisines} theme='light'/>
                                    ) : (
                                        <Text className="text-primary-400 dark:text-dark-400">No cuisines set</Text>
                                    )}
                                </View>
                            </>
                        )}
                    </Card>

                    <Card
                        title="About"
                        customHeader='justify-center'
                        customHeaderText='text-xl'
                    >
                        {!editingAbout && (
                            <Button
                                onPress={() => setEditingAbout(true)}
                                icon="pencil"
                                style="accent"
                                customClasses="absolute -top-[70px] -right-2 z-10 p-3 rounded-full pl-3"
                            />
                        )}

                        {editingAbout ? (
                            <View>

                                <Input
                                    value={aboutText}
                                    onChangeText={setAboutText}
                                    placeholder="Tell customers about yourself and your cooking..."
                                    isTextArea={true}
                                    maxLength={500}
                                    multiline={true}
                                />
                                <Text className="text-sm text-right text-gray-500 mt-1 dark:text-gray-400">
                                    {aboutText.length}/500
                                </Text>
                                <Button
                                    onPress={handleCancelEdit}
                                    icon="x"
                                    style="accent"
                                    customClasses="absolute -top-[70px] right-10 z-10 p-3 rounded-full pl-3"
                                />
                                <Button
                                    onPress={handleSaveAbout}
                                    icon={savingAbout ? 'sync' : 'check'}
                                    style="accent"
                                    customClasses="absolute -top-[70px] -right-2 z-10 p-3 rounded-full pl-3"
                                    disabled={savingAbout}
                                />
                            </View>
                        ) : (
                            <Text className="text-lg text-center text-primary-400 text-pretty dark:text-dark-400">
                                {profileData?.description || 'No description available. Click the edit button to add one.'}
                            </Text>
                        )}
                    </Card>
                    <View className="flex-row w-full justify-between" >
                    <Button
                        title="Manage Menu"
                        style="secondary"
                        customClasses="w-[48%]"
                        href={`/ChefMenuScreen`}
                    />
                    <Button
                        title="Customer View"
                        style="secondary"
                        customClasses="w-[48%]"
                        href={`/ChefProfileScreen/${profileId}`}
                    />
                    </View>
                </>
            )}

            <Button
                title="Log out"
                style="primary"
                onPress={logout}
            />

            <View className="h-24" />
        </ScrollView>
    );
}