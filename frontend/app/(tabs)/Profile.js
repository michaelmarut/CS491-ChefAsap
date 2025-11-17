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
import AddCardModal from "../components/AddCardModal";
import TestPaymentButton from "../components/TestPaymentButton";

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
    
    // Stripe payment methods state
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId || !token || !userType || !profileId) return;

            setLoading(true);
            setError(null);

            try {
                const url = `${apiUrl}/profile/${userType}/${profileId}`;
                console.log('Fetching profile from:', url);

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
                console.error('Profile fetch error:', err);
                const errorMsg = `Network error. Could not connect to API.\n\nURL: ${apiUrl}\nError: ${err.message}`;
                setError(errorMsg);
                Alert.alert('Connection Error', errorMsg);
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

    // Fetch payment methods for customers
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            if (userType !== 'customer' || !userId) return;

            setLoadingPaymentMethods(true);
            try {
                const response = await fetch(`${apiUrl}/stripe-payment/payment-methods?customer_id=${userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    setPaymentMethods(data.payment_methods || []);
                } else {
                    console.error('Failed to fetch payment methods:', data.error);
                }
            } catch (error) {
                console.error('Error fetching payment methods:', error);
            } finally {
                setLoadingPaymentMethods(false);
            }
        };

        fetchPaymentMethods();
    }, [userType, userId, apiUrl, token]);

    const handleDeleteCard = async (paymentMethodId) => {
        Alert.alert(
            'Delete Card',
            'Are you sure you want to delete this card?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${apiUrl}/stripe-payment/payment-methods/${paymentMethodId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                },
                                body: JSON.stringify({ customer_id: userId }),
                            });

                            const data = await response.json();
                            if (response.ok) {
                                Alert.alert('Success', 'Card deleted successfully');
                                // Refresh payment methods
                                setPaymentMethods(paymentMethods.filter(pm => pm.id !== paymentMethodId));
                            } else {
                                Alert.alert('Error', data.error || 'Failed to delete card');
                            }
                        } catch (error) {
                            console.error('Delete card error:', error);
                            Alert.alert('Error', 'An error occurred while deleting card');
                        }
                    },
                },
            ]
        );
    };

    const handleSetDefaultCard = async (paymentMethodId) => {
        try {
            const response = await fetch(`${apiUrl}/stripe-payment/payment-methods/${paymentMethodId}/set-default`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ customer_id: userId }),
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert('Success', 'Default payment method updated');
                // Refresh payment methods to update default status
                const updatedMethods = paymentMethods.map(pm => ({
                    ...pm,
                    is_default: pm.id === paymentMethodId,
                }));
                setPaymentMethods(updatedMethods);
            } else {
                Alert.alert('Error', data.error || 'Failed to set default payment method');
            }
        } catch (error) {
            console.error('Set default card error:', error);
            Alert.alert('Error', 'An error occurred while setting default payment method');
        }
    };

    const refreshPaymentMethods = async () => {
        setLoadingPaymentMethods(true);
        try {
            const response = await fetch(`${apiUrl}/stripe-payment/payment-methods?customer_id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                setPaymentMethods(data.payment_methods || []);
            }
        } catch (error) {
            console.error('Error refreshing payment methods:', error);
        } finally {
            setLoadingPaymentMethods(false);
        }
    };

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
        <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5">
            {/*console.log(JSON.stringify(profileData))*/}
            <Card
                title="Profile"
                headerIcon="person"
            >
                <Button
                    href="/ProfileSettings"
                    icon="gear"
                    style="accent"
                    customClasses="absolute -top-[62px] -right-2 z-10 p-3 rounded-full pl-3"
                />
                <ThemeButton />

                <ProfilePicture photoUrl={profileData?.photo_url} firstName={profileData?.first_name} lastName={profileData?.last_name} />
                <Text className="text-xl font-bold text-wrap text-center mb-1 mt-2 text-primary-400 dark:text-dark-400">{profileData?.first_name} {profileData?.last_name} </Text>
                <Text className="text-lg text-wrap text-center text-primary-400 dark:text-dark-400">{userType?.charAt(0).toUpperCase() + userType?.slice(1)}</Text>
                {userType === 'chef' && (
                    <>
                        <RatingsDisplay rating={profileData?.avg_rating} />
                        <View className='flex-row items-center justify-center'>
                            <Text className="text-lg text-center text-primary-400 pb-2 dark:text-dark-400">
                                {profileData?.total_reviews} Total Reviews

                            </Text>
                            <Button
                                icon='cross-reference'
                                base='link'
                                style='transparent'
                                customClasses='m-0 px-0 py-0 pl-2 pb-4'
                                onPress={() => alert("Reviews Placeholder")}
                            />
                        </View>
                    </>
                )}
                <Text className="text-sm text-center text-primary-400 pt-2 border-t border-primary-200 dark:text-dark-400 dark:border-dark-200">Member Since: {profileData?.member_since}</Text>
            </Card>

            {userType === "customer" ? (
                <>
                    <Card
                        title="Payment Methods"
                        headerIcon="credit-card"
                    >
                        {loadingPaymentMethods ? (
                            <LoadingIcon icon="spinner" size={64} message=""/>
                        ) : paymentMethods.length > 0 ? (
                            <View>
                                {paymentMethods.map((pm) => (
                                    <View
                                        key={pm.id}
                                        className="flex-row items-center justify-between p-3 mb-2 border border-gray-200 dark:border-gray-600 rounded-lg"
                                    >
                                        <View className="flex-row items-center flex-1">
                                            <Text className="text-2xl mr-3">💳</Text>
                                            <View className="flex-1">
                                                <Text className="text-base font-semibold text-primary-400 dark:text-dark-400">
                                                    •••• {pm.last4}
                                                </Text>
                                                <Text className="text-xs text-gray-500 dark:text-gray-400">
                                                    {pm.brand.toUpperCase()} • Expires {pm.exp_month}/{pm.exp_year}
                                                </Text>
                                                {pm.is_default && (
                                                    <Text className="text-xs text-lime-600 dark:text-lime-400 mt-1">
                                                        ✓ Default
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        <View className="flex-row gap-2">
                                            {!pm.is_default && (
                                                <TouchableOpacity
                                                    onPress={() => handleSetDefaultCard(pm.id)}
                                                    className="px-3 py-1 bg-lime-100 dark:bg-lime-900 rounded"
                                                >
                                                    <Text className="text-xs text-lime-700 dark:text-lime-300">
                                                        Set Default
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                            <TestPaymentButton
                                                customerId={userId}
                                                paymentMethodId={pm.id}
                                            />
                                            <TouchableOpacity
                                                onPress={() => handleDeleteCard(pm.id)}
                                                className="p-2"
                                            >
                                                <Octicons name="trash" size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                                <Button
                                    title="Add New Card"
                                    icon="plus"
                                    style="secondary"
                                    onPress={() => setShowAddCardModal(true)}
                                    customClasses="mt-2"
                                />
                            </View>
                        ) : (
                            <View>
                                <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                                    No saved cards yet
                                </Text>
                                <Button
                                    title="Add Bank Card"
                                    icon="plus"
                                    style="secondary"
                                    onPress={() => setShowAddCardModal(true)}
                                />
                            </View>
                        )}
                        <Text className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                            Powered by Stripe - PCI DSS compliant
                        </Text>
                    </Card>

                    {/* Add Card Modal */}
                    <AddCardModal
                        visible={showAddCardModal}
                        onClose={() => setShowAddCardModal(false)}
                        onSuccess={refreshPaymentMethods}
                        customerId={userId}
                    />

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
                                    customClasses="absolute -top-[62px] -right-2 z-10 p-3 rounded-full pl-3"
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
                                                : 'text-gray-640 dark:text-gray-200'
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
                                                    : 'bg-gray-200 dark:bg-gray-640'
                                                    }`}
                                            >
                                                <Text className={`text-sm ${selectedCuisines.includes(cuisine.name)
                                                    ? 'text-white font-semibold'
                                                    : 'text-gray-640 dark:text-gray-300'
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
                                        customClasses="absolute -top-[62px] right-10 z-10 p-3 rounded-full pl-3"
                                />
                                <Button
                                    onPress={handleSaveDetails}
                                    icon={savingDetails ? 'sync' : 'check'}
                                    style="accent"
                                        customClasses="absolute -top-[62px] -right-2 z-10 p-3 rounded-full pl-3"
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
                                customClasses="absolute -top-[62px] -right-2 z-10 p-3 rounded-full pl-3"
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
                                    customClasses="absolute -top-[62px] right-10 z-10 p-3 rounded-full pl-3"
                                />
                                <Button
                                    onPress={handleSaveAbout}
                                    icon={savingAbout ? 'sync' : 'check'}
                                    style="accent"
                                    customClasses="absolute -top-[62px] -right-2 z-10 p-3 rounded-full pl-3"
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

            <View className="h-8" />
        </ScrollView>
    );
}