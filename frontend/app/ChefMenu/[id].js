import React, { useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { ScrollView, Text, Alert, View, Modal, Image } from "react-native";
import { Octicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import LoadingIcon from "../components/LoadingIcon";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import Card from "../components/Card";
import TagsBox from '../components/TagsBox';
import RatingsDisplay from '../components/RatingsDisplay';

const menuItemCard = ({ item, onAddToOrder, apiUrl, userType }) => (
    <View className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mb-4 w-full" key={item?.id}>
        <Text className="text-lg font-medium mb-2 text-center text-justified text-primary-400 dark:text-dark-400 w-full border-b border-primary-400 dark:border-dark-400">
            {item?.dish_name || 'Dish Name'}
        </Text>
        <View className="flex-row border-b border-primary-400 dark:border-dark-400 pb-2">
            <View className="flex w-1/2 justify-between pr-2">
                <TagsBox words={[].concat(item?.cuisine_type, item?.dietary_info)} theme='light' />
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
                    <Image
                        source={{ uri: `${apiUrl}${item.photo_url}` }}
                        className="h-[150px] w-[150px] rounded-xl shadow-sm shadow-primary-500 dark:shadow-dark-500 border border-primary-400 dark:border-dark-400"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="bg-white h-[150px] justify-center rounded-xl shadow-sm shadow-primary-500 dark:shadow-dark-500 border border-primary-400 dark:border-dark-400">
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
            disabled={userType === 'chef' || !item?.is_available}
        />
    </View>
);

export default function ChefMenu() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const { token, userId, profileId, userType } = useAuth();
    const { apiUrl } = getEnvVars();

    const [chefData, setChefData] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [featuredItems, setFeaturedItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [chefCuisines, setChefCuisines] = useState([]);
    const [mealTimings, setMealTimings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orderItems, setOrderItems] = useState([]);

    // Date/Time selection states (using separate values instead of Date objects)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [showOrderModal, setShowOrderModal] = useState(false);

    // Payment states
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    // Weekly availability and bookings
    const [weeklyAvailability, setWeeklyAvailability] = useState({});
    const [bookedBlocks, setBookedBlocks] = useState([]);

    // Auto-adjust selected hour when date changes or available hours change
    useEffect(() => {
        if (getAvailableHours.length > 0 && !getAvailableHours.includes(selectedHour)) {
            setSelectedHour(getAvailableHours[0]);
        }
    }, [selectedMonth, selectedDay, selectedYear, getAvailableHours]);

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

                // Fetch categories
                const categoriesUrl = `${apiUrl}/api/menu/chef/${chefId}/categories`;
                const categoriesResponse = await fetch(categoriesUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const categoriesData = await categoriesResponse.json();

                if (categoriesResponse.ok) {
                    setCategories(categoriesData.categories || []);
                    console.log('Categories loaded:', categoriesData.categories?.length || 0);
                } else {
                    console.log('Categories fetch error:', categoriesData.error);
                    setCategories([]);
                }

                // Fetch weekly availability
                try {
                    const availUrl = `${apiUrl}/profile/chef/${chefId}/weekly-availability`;
                    console.log('Fetching weekly availability from:', availUrl);
                    const availResp = await fetch(availUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    const availData = await availResp.json();
                    console.log('Weekly availability response:', availResp.status, availData);
                    if (availResp.ok) {
                        const schedule = availData.weekly_schedule || {};
                        setWeeklyAvailability(schedule);
                        console.log('Weekly availability set to:', schedule);
                        
                        // Check if chef has set any availability
                        const hasAnyAvailability = Object.values(schedule).some(day => day && day.length > 0);
                        if (!hasAnyAvailability) {
                            console.warn('⚠️ Chef has not set weekly availability yet');
                        }
                    } else {
                        console.error('Failed to fetch weekly availability:', availData);
                    }
                } catch (e) {
                    console.error('Failed to fetch weekly availability:', e);
                }

                // Fetch bookings for next 30 days to exclude booked times
                try {
                    const today = new Date();
                    const futureDate = new Date(today);
                    futureDate.setDate(today.getDate() + 30);
                    const start = today.toISOString().split('T')[0];
                    const end = futureDate.toISOString().split('T')[0];
                    const bookingsUrl = `${apiUrl}/booking/bookings/chef/${chefId}?start=${start}&end=${end}`;
                    console.log('Fetching bookings from:', bookingsUrl);
                    const bookingsResp = await fetch(bookingsUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    const bookingsData = await bookingsResp.json();
                    console.log('Bookings response:', bookingsResp.status, bookingsData);
                    if (bookingsResp.ok && bookingsData.bookings) {
                        const blocks = [];
                        bookingsData.bookings.forEach(b => {
                            try {
                                // Parse date as local time to avoid timezone issues
                                const parts = b.booking_date.split('-');
                                const year = parseInt(parts[0], 10);
                                const month = parseInt(parts[1], 10) - 1;
                                const day = parseInt(parts[2], 10);
                                const d = new Date(year, month, day);
                                const dayKey = d.getDay();
                                const hour = parseInt((b.booking_time || '00:00').split(':')[0], 10);
                                blocks.push(`${dayKey}-${hour}`);
                            } catch (e) {
                                console.error('Error parsing booking:', e);
                            }
                        });
                        setBookedBlocks(blocks);
                        console.log('Booked blocks loaded:', blocks);
                    } else {
                        console.error('Failed to fetch bookings:', bookingsData);
                    }
                } catch (e) {
                    console.error('Failed to fetch bookings:', e);
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

    // Group items by category
    const itemsByCategory = useMemo(() => {
        const grouped = {};

        // Add all categories
        categories.forEach(cat => {
            grouped[cat.id] = {
                name: cat.category_name,
                items: []
            };
        });

        // Add uncategorized group
        grouped['uncategorized'] = {
            name: 'Other Dishes',
            items: []
        };

        // Group menu items
        menuItems.forEach(item => {
            if (item.category_id && grouped[item.category_id]) {
                grouped[item.category_id].items.push(item);
            } else {
                grouped['uncategorized'].items.push(item);
            }
        });

        return grouped;
    }, [menuItems, categories]);

    // Handle adding item to order
    const handleAddToOrder = (item) => {
        if (!item.is_available) {
            Alert.alert('Not Available', 'This dish is currently not available.');
            return;
        }

        // Check if item already in order
        const existingItem = orderItems.find(orderItem => orderItem.id === item.id);

        if (existingItem) {
            // Increase quantity
            setOrderItems(orderItems.map(orderItem =>
                orderItem.id === item.id
                    ? { ...orderItem, quantity: orderItem.quantity + 1 }
                    : orderItem
            ));
            Alert.alert('Added to Order', `${item.dish_name} quantity increased to ${existingItem.quantity + 1}`);
        } else {
            // Add new item with quantity 1
            setOrderItems([...orderItems, { ...item, quantity: 1 }]);
            Alert.alert('Added to Order', `${item.dish_name} added to your order!`);
        }
    };

    // Fetch customer's payment methods
    const fetchPaymentMethods = async () => {
        console.log('=== Fetching payment methods ===');
        console.log('User ID:', userId);
        console.log('Profile ID:', profileId);
        console.log('User Type:', userType);
        console.log('Token:', token ? 'Present' : 'Missing');
        console.log('API URL:', apiUrl);

        // Use userId instead of profileId
        const userIdToUse = userId || profileId;
        console.log('Using user ID:', userIdToUse);

        if (!userIdToUse) {
            console.error('No user ID available!');
            Alert.alert('Error', 'User not logged in');
            return;
        }

        setLoadingPaymentMethods(true);
        try {
            const url = `${apiUrl}/stripe-payment/payment-methods?customer_id=${userIdToUse}`;
            console.log('Fetching from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            console.log('Payment methods response:', data);

            if (response.ok) {
                console.log('Payment methods count:', data.payment_methods?.length || 0);
                setPaymentMethods(data.payment_methods || []);
                // Auto-select default payment method if available
                const defaultMethod = data.payment_methods?.find(pm => pm.is_default);
                if (defaultMethod) {
                    console.log('Auto-selecting default method:', defaultMethod.id);
                    setSelectedPaymentMethod(defaultMethod.id);
                }
            } else {
                console.error('Failed to fetch payment methods:', data.error);
                setPaymentMethods([]);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            setPaymentMethods([]);
        } finally {
            setLoadingPaymentMethods(false);
        }
    };

    // Fetch payment methods when modal opens
    useEffect(() => {
        if (showOrderModal && userType === 'customer') {
            fetchPaymentMethods();
        }
    }, [showOrderModal]);

    // Get available hours for the selected date
    const getAvailableHours = useMemo(() => {
        const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
        const dayKey = selectedDate.getDay(); // 0=Sunday, 1=Monday, etc.
        
        console.log('=== Computing Available Hours ===');
        console.log('Selected date:', selectedDate.toDateString());
        console.log('Day of week:', dayKey);
        console.log('Weekly availability:', weeklyAvailability);
        console.log('Booked blocks:', bookedBlocks);
        
        // Get weekly availability for this day
        const dayAvailability = weeklyAvailability[dayKey] || [];
        console.log('Day availability:', dayAvailability);
        
        // Extract available hours from time slots
        const availableHoursSet = new Set();
        dayAvailability.forEach(slot => {
            if (slot.is_available) {
                const startHour = parseInt(slot.start_time.split(':')[0], 10);
                const endHour = parseInt(slot.end_time.split(':')[0], 10);
                for (let h = startHour; h < endHour; h++) {
                    availableHoursSet.add(h);
                }
            }
        });
        console.log('Available hours from schedule:', Array.from(availableHoursSet));
        
        // Filter out booked hours for this specific date
        const bookedHoursForDay = new Set();
        bookedBlocks.forEach(block => {
            const [blockDayKey, blockHour] = block.split('-').map(Number);
            if (blockDayKey === dayKey) {
                bookedHoursForDay.add(blockHour);
            }
        });
        console.log('Booked hours for this day:', Array.from(bookedHoursForDay));
        
        // Return hours that are available and not booked
        const availableHours = Array.from(availableHoursSet)
            .filter(hour => !bookedHoursForDay.has(hour))
            .sort((a, b) => a - b);
        
        console.log('Final available hours:', availableHours);
        return availableHours;
    }, [selectedYear, selectedMonth, selectedDay, weeklyAvailability, bookedBlocks]);

    // Handle placing order with selected date/time
    const handlePlaceOrder = async () => {
        try {
            // Validate payment method selected
            if (!selectedPaymentMethod) {
                Alert.alert('Payment Required', 'Please select a payment method to continue.');
                return;
            }

            setPaymentProcessing(true);

            // Combine selected date and time components
            const deliveryDateTime = new Date(
                selectedYear,
                selectedMonth,
                selectedDay,
                selectedHour,
                selectedMinute
            );

            // Calculate total
            const total = (orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.15).toFixed(2);

            // Step 1: Create payment intent
            const paymentResponse = await fetch(`${apiUrl}/stripe-payment/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    customer_id: profileId,
                    amount: total,
                    payment_method_id: selectedPaymentMethod,
                    description: `Booking from Chef ${chefData?.first_name} ${chefData?.last_name} - ${orderItems.length} items`
                }),
            });

            const paymentData = await paymentResponse.json();

            if (!paymentResponse.ok) {
                Alert.alert('Payment Failed', paymentData.error || 'Failed to process payment. Please try again.');
                setPaymentProcessing(false);
                return;
            }

            // Step 2: If payment successful, create booking
            const cuisineType = orderItems.length > 0 ? orderItems[0].cuisine_type || 'Mixed' : 'Mixed';
            const mealType = getMealType(selectedHour);

            // Format date and time using local timezone (not UTC)
            const bookingDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
            const bookingTime = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;

            const bookingResponse = await fetch(`${apiUrl}/booking/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    customer_id: profileId,
                    cuisine_type: cuisineType,
                    meal_type: mealType,
                    event_type: 'dinner',
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    produce_supply: 'chef',
                    number_of_people: orderItems.reduce((sum, item) => sum + item.quantity, 0),
                    special_notes: `Order items: ${orderItems.map(item => `${item.dish_name} (x${item.quantity})`).join(', ')}. Total: $${total}`
                }),
            });

            const bookingResult = await bookingResponse.json();

            if (!bookingResponse.ok) {
                Alert.alert('Booking Error', bookingResult.error || 'Payment processed but booking failed. Please contact support.');
                setPaymentProcessing(false);
                return;
            }

            // Step 3: Book the chef for this booking
            const bookChefResponse = await fetch(`${apiUrl}/booking/book-chef`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    booking_id: bookingResult.booking_id,
                    chef_id: parseInt(id, 10)
                }),
            });

            const bookChefResult = await bookChefResponse.json();

            if (!bookChefResponse.ok) {
                Alert.alert('Booking Error', bookChefResult.error || 'Payment processed but chef booking failed. Please contact support.');
                setPaymentProcessing(false);
                return;
            }

            // Success! Show confirmation
            setShowOrderModal(false);
            setPaymentProcessing(false);

            // Get payment method details for confirmation
            const selectedCard = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
            
            // Format delivery date and time for display
            // Add 1 day to compensate for timezone display issue
            const displayDate = new Date(selectedYear, selectedMonth, selectedDay);
            displayDate.setDate(displayDate.getDate() + 1);
            const deliveryDateFormatted = `${displayDate.getMonth() + 1}/${displayDate.getDate()}/${displayDate.getFullYear()}`;
            const deliveryTimeFormatted = `${selectedHour % 12 || 12}:${String(selectedMinute).padStart(2, '0')} ${selectedHour >= 12 ? 'PM' : 'AM'}`;

            Alert.alert(
                'Booking Confirmed! 🎉',
                `Booking #${bookingResult.booking_id}\n\n` +
                `Amount Charged: $${total}\n` +
                `Payment Method: ${selectedCard?.brand.toUpperCase()} •••• ${selectedCard?.last4}\n` +
                `Booking: ${deliveryDateFormatted}, ${deliveryTimeFormatted}\n\n` +
                `Your booking has been confirmed and sent to the chef!`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Clear order items and reset date/time
                            setOrderItems([]);
                            const now = new Date();
                            setSelectedMonth(now.getMonth());
                            setSelectedDay(now.getDate());
                            setSelectedYear(now.getFullYear());
                            setSelectedHour(12);
                            setSelectedMinute(0);
                            setSelectedPaymentMethod(null);
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Booking error:', error);
            Alert.alert('Error', 'Network error. Could not process booking.');
            setPaymentProcessing(false);
        }
    };

    // Helper function to determine meal type based on time
    const getMealType = (hour) => {
        if (hour >= 5 && hour < 11) return 'breakfast';
        if (hour >= 11 && hour < 16) return 'lunch';
        return 'dinner';
    };

    /*if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100">
                    <LoadingIcon message="Loading Chef Menu..." />
                </View>
            </>
        );
    }*/

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5">
                {/*<Text>{JSON.stringify(chefData)}</Text>*/}
                <View className="flex justify-center items-center bg-primary-100 dark:bg-dark-100 rounded-3xl mb-4 border-2 shadow-sm shadow-primary-500 border-primary-100 dark:border-dark-100">
                    <View className="flex-row w-full justify-between items-center p-2 pl-4 pr-4">
                        <Text className="text-3xl font-bold text-primary-400 text-center dark:text-dark-400">{chefData?.first_name} {chefData?.last_name}</Text>
                        {chefData?.distance && (
                            <Text className="text-md text-primary-400 dark:text-dark-400">{chefData.distance} Mi.</Text>
                        )}
                    </View>


                    <View className="flex-row w-full justify-between bg-base-100 dark:bg-base-dark-100 border-t-2 border-primary-300 dark:border-dark-300">
                        <View className="flex justify-center items-center w-1/2 bg-primary-100 pt-2 pl-4 pr-4 dark:bg-dark-100 gap-4">
                            {chefData?.cuisines && chefData.cuisines.length > 0 && (
                                <TagsBox words={chefData.cuisines} />
                            )}
                            {chefData?.meal_timings && chefData.meal_timings.length > 0 && (
                                <View>
                                    <Text className="text-md text-primary-400 pt-2 dark:text-dark-400 text-center">Available:</Text>
                                    <Text className="text-sm text-primary-400 pb-2 dark:text-dark-400 text-center text-wrap">{chefData.meal_timings.join(', ')}</Text>
                                </View>
                            )}
                        </View>
                        <View className="flex justify-center items-center w-1/2 p-4 rounded-br-3xl">
                            <ProfilePicture photoUrl={chefData?.photo_url} firstName={chefData?.first_name} lastName={chefData?.last_name} size={28} />
                            <RatingsDisplay rating={chefData?.average_rating} totalRatings={chefData?.total_reviews} />
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
                        featuredItems.map(item => menuItemCard({ item, onAddToOrder: handleAddToOrder, apiUrl, userType }))
                    ) : (
                        <Text className="text-primary-400 text-center py-4 dark:text-dark-400">
                            No featured dishes available
                        </Text>
                    )}
                </Card>

                {/* Display categories */}
                {categories.map(category => {
                    const categoryItems = itemsByCategory[category.id]?.items || [];
                    if (categoryItems.length === 0) return null;

                    return (
                        <Card
                            key={category.id}
                            title={category.category_name}
                            customHeader='justify-center'
                            customHeaderText='text-xl'
                            isCollapsible={true}
                            startExpanded={false}
                        >
                            {categoryItems.map(item => menuItemCard({ item, onAddToOrder: handleAddToOrder, apiUrl, userType }))}
                        </Card>
                    );
                })}

                {/* Display uncategorized items */}
                {itemsByCategory['uncategorized']?.items?.length > 0 && (
                    <Card
                        title="Other Dishes"
                        customHeader='justify-center'
                        customHeaderText='text-xl'
                        isCollapsible={true}
                        startExpanded={false}
                    >
                        {itemsByCategory['uncategorized'].items.map(item => menuItemCard({ item, onAddToOrder: handleAddToOrder, apiUrl, userType }))}
                    </Card>
                )}

                {menuItems.length === 0 && (
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

                {orderItems.length > 0 && (
                    <>
                        <View className="border-t-2 border-primary-400 dark:border-dark-400 mt-1 mb-4" />
                        <Card
                            title={`My Selection (${orderItems.length} ${orderItems.length === 1 ? 'item' : 'items'})`}
                            customHeader='justify-center'
                            customHeaderText='text-xl'
                            isCollapsible={true}
                            startExpanded={false}
                        >
                            {orderItems.map((item, index) => (
                                <View key={index} className="bg-base-100 dark:bg-base-dark-100 p-4 rounded-lg mb-2 shadow-sm shadow-primary-500">
                                    <View className="flex-row justify-between items-center">
                                        <View className="flex-0 w-1/3">
                                            <Text className="text-lg font-semibold text-primary-400 dark:text-dark-400">
                                                {item.dish_name}
                                            </Text>
                                            <Text className="text-sm text-primary-400 dark:text-dark-400">
                                                ${item.price?.toFixed(2)} × {item.quantity}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center justify-center w-1/3">
                                            <Button
                                                icon="dash"
                                                customClasses={`rounded-full m-1 h-12 w-12`}
                                                base='icon'
                                                onPress={() => {
                                                    if (item.quantity > 1) {
                                                        setOrderItems(orderItems.map(orderItem =>
                                                            orderItem.id === item.id
                                                                ? { ...orderItem, quantity: orderItem.quantity - 1 }
                                                                : orderItem
                                                        ));
                                                    } else {
                                                        setOrderItems(orderItems.filter(orderItem => orderItem.id !== item.id));
                                                    }
                                                }}
                                            />
                                            <View className={`flex items-center justify-center border-2 border-primary-300 rounded-lg bg-primary-100 shadow-sm shadow-primary-500 dark:border-dark-300 dark:bg-dark-100 h-12 w-12`}>
                                                <Text className="text-xl font-bold text-primary-500">{item.quantity}</Text>
                                            </View>

                                            <Button
                                                icon="plus"
                                                customClasses={`rounded-full m-1 h-12 w-12`}
                                                base='icon'
                                                onPress={() => {
                                                    setOrderItems(orderItems.map(orderItem =>
                                                        orderItem.id === item.id
                                                            ? { ...orderItem, quantity: orderItem.quantity + 1 }
                                                            : orderItem
                                                    ));
                                                }}
                                            />
                                        </View>
                                        <Text className="text-right text-lg font-bold text-primary-400 dark:text-dark-400 w-1/4">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                            <View className="flex-row justify-between items-center m-2 mb-0 mt-1">
                                <Text className="text-md font-bold text-primary-400 dark:text-dark-400">
                                    Subtotal:
                                </Text>
                                <Text className="text-lg font-bold text-primary-400 dark:text-dark-400">
                                    ${orderItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-center m-2 mt-0">
                                <Text className="text-xs font-bold text-primary-400 dark:text-dark-400">
                                    Service Fee (15%):
                                </Text>
                                <Text className="text-sm font-bold text-primary-400 dark:text-dark-400">
                                    + ${(orderItems.reduce((total, item) => total + (item.price * item.quantity), 0) * 0.15).toFixed(2)}
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-center m-2 mt-0 border-t-2 border-primary-400 dark:border-dark-400 pt-2">
                                <Text className="text-xl font-bold text-primary-400 dark:text-dark-400">
                                    Total:
                                </Text>
                                <Text className="text-2xl font-bold text-primary-400 dark:text-dark-400">
                                    ${(orderItems.reduce((total, item) => total + (item.price * item.quantity), 0) * 1.15).toFixed(2)}
                                </Text>
                            </View>
                            <Button
                                title="Place Booking"
                                style="primary"
                                customClasses="w-full"
                                onPress={() => setShowOrderModal(true)}
                            />
                        </Card>
                    </>
                )}

                {/* Booking Date/Time Selection Modal */}
                <Modal
                    visible={showOrderModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowOrderModal(false)}
                >
                    <View className="flex-1 justify-center items-center bg-black/50">
                        <View className="bg-base-100 dark:bg-base-dark-100 border-4 border-primary-400 dark:border-dark-400 rounded-xl p-4 w-11/12 max-h-[90%]">
                            <Text className="text-2xl font-bold text-primary-400 dark:text-dark-400 mb-4 text-center">
                                Select Booking Date & Time
                            </Text>

                            {/* Booking Summary */}
                            <View className="bg-white dark:bg-black p-4 rounded-lg mb-4 shadow-sm shadow-primary-500 dark:shadow-dark-500">
                                <Text className="text-lg font-semibold text-primary-400 dark:text-dark-400 mb-2">
                                    Booking Summary
                                </Text>
                                <View className="flex-row justify-between">
                                    <Text className="text-primary-400 dark:text-dark-400">
                                        Items: {orderItems.length}
                                    </Text>
                                    <Text className="text-primary-400 dark:text-dark-400">
                                        Total: ${(orderItems.reduce((total, item) => total + (item.price * item.quantity), 0) * 1.15).toFixed(2)}
                                    </Text>
                                </View>
                            </View>

                            {/* Date Selection */}
                            <View className="bg-primary-100 dark:bg-dark-100 p-4 rounded-lg mb-3">
                                <Text className="text-primary-400 dark:text-dark-400 font-semibold mb-2">
                                    Booking Date:
                                </Text>
                                <View className="flex-row justify-between">
                                    <View className="flex-1 mr-1">
                                        <Text className="text-xs text-primary-400 dark:text-dark-400 mb-1">Month</Text>
                                        <View className='border border-primary-200 bg-white dark:bg-black rounded-lg shadow-sm shadow-primary-500 dark:border-dark-200'>
                                            <Picker
                                                selectedValue={selectedMonth}
                                                onValueChange={(value) => setSelectedMonth(value)}
                                            >
                                                {Array.from({ length: 12 }, (_, i) => i).map(month => (
                                                    <Picker.Item key={month} label={String(month + 1)} value={month} />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>
                                    <Text className="text-primary-400 dark:text-dark-400 text-xl font-bold pt-10">/</Text>
                                    <View className="flex-1 mx-1">
                                        <Text className="text-xs text-primary-400 dark:text-dark-400 mb-1">Day</Text>
                                        <View className='border border-primary-200 bg-white dark:bg-black rounded-lg shadow-sm shadow-primary-500 dark:border-dark-200'>
                                            <Picker
                                                selectedValue={selectedDay}
                                                onValueChange={(value) => setSelectedDay(value)}
                                            >
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                    <Picker.Item key={day} label={String(day)} value={day} />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>
                                    <Text className="text-primary-400 dark:text-dark-400 text-xl font-bold pt-10">/</Text>
                                    <View className="flex-1 ml-1">
                                        <Text className="text-xs text-primary-400 dark:text-dark-400 mb-1">Year</Text>
                                        <View className='border border-primary-200 bg-white dark:bg-black rounded-lg shadow-sm shadow-primary-500 dark:border-dark-200'>
                                            <Picker
                                                selectedValue={selectedYear}
                                                onValueChange={(value) => setSelectedYear(value)}
                                            >
                                                {Array.from({ length: 10 }, (_, i) => i + 25).map(year => (
                                                    <Picker.Item key={year} label={String(year)} value={2000 + year} />
                                                ))}
                                            </Picker>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Time Selection */}
                            <View className="bg-primary-100 dark:bg-dark-100 p-4 rounded-lg mb-4">
                                <Text className="text-primary-400 dark:text-dark-400 font-semibold mb-2">
                                    Time:
                                </Text>
                                {getAvailableHours.length === 0 ? (
                                    <View className="bg-white dark:bg-black p-4 rounded-lg">
                                        <Text className="text-primary-400 dark:text-dark-400 text-center font-semibold mb-2">
                                            No available time slots for this date
                                        </Text>
                                        {Object.values(weeklyAvailability).every(day => !day || day.length === 0) && (
                                            <Text className="text-primary-400 dark:text-dark-400 text-center text-sm">
                                                This chef has not set their weekly availability yet.
                                            </Text>
                                        )}
                                    </View>
                                ) : (
                                    <View className="flex-row justify-between items-center">
                                        <View className="flex-1 mr-2">
                                            {/*<Text className="text-xs text-primary-400 dark:text-dark-400 mb-1">Hour</Text>*/}
                                            <View className='border border-primary-200 bg-white dark:bg-black rounded-lg shadow-sm shadow-primary-500 dark:border-dark-200'>
                                                <Picker
                                                    selectedValue={selectedHour}
                                                    onValueChange={(value) => setSelectedHour(value)}
                                                >
                                                    {getAvailableHours.map(hour => (
                                                        <Picker.Item key={hour} label={String(hour).padStart(2, '0')} value={hour} />
                                                    ))}
                                                </Picker>
                                            </View>
                                        </View>
                                        <Text className="text-primary-400 dark:text-dark-400 text-xl font-bold">:</Text>
                                        <View className="flex-1 ml-2">
                                            {/*<Text className="text-xs text-primary-400 dark:text-dark-400 mb-1">Minute</Text>*/}
                                            <View className='border border-primary-200 bg-white dark:bg-black rounded-lg shadow-sm shadow-primary-500 dark:border-dark-200'>
                                                <Picker
                                                    selectedValue={selectedMinute}
                                                    onValueChange={(value) => setSelectedMinute(value)}
                                                >
                                                    {[0, 15, 30, 45].map(minute => (
                                                        <Picker.Item key={minute} label={String(minute).padStart(2, '0')} value={minute} />
                                                    ))}
                                                </Picker>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Payment Method Selection */}
                            <View className="bg-primary-100 dark:bg-dark-100 p-4 rounded-lg mb-4">
                                <Text className="text-primary-400 dark:text-dark-400 font-semibold mb-2">
                                    Payment Method:
                                </Text>

                                {loadingPaymentMethods ? (
                                    <View className="py-4">
                                        <LoadingIcon icon="spinner" size={48} message="" />
                                    </View>
                                ) : paymentMethods.length === 0 ? (
                                    <View>
                                        <Text className="text-primary-400 dark:text-dark-400 text-center mb-3">
                                            No payment methods available
                                        </Text>
                                        <Button
                                            title="Add Card in Profile"
                                            style="secondary"
                                            onPress={() => {
                                                setShowOrderModal(false);
                                                router.push('/(tabs)/Profile');
                                            }}
                                        />
                                    </View>
                                ) : (
                                    <View>
                                        {paymentMethods.map((method) => (
                                            <View
                                                key={method.id}
                                                className={`flex-row items-center justify-between p-3 mb-2 rounded-lg border bg-white dark:bg-black rounded-lg shadow-sm shadow-primary-500
                                                    ${selectedPaymentMethod === method.id
                                                        ? 'border-primary-400 dark:border-dark-400'
                                                        : 'border-primary-200 dark:border-dark-200'
                                                    }`}
                                                onTouchEnd={() => setSelectedPaymentMethod(method.id)}
                                            >
                                                <View className="flex-0">
                                                    <Text className="text-primary-400 dark:text-dark-400 font-semibold">
                                                        {method.brand.toUpperCase()} •••• {method.last4}
                                                    </Text>
                                                    <Text className="text-primary-400 dark:text-dark-400 text-sm">
                                                        Expires {method.exp_month}/{method.exp_year}
                                                    </Text>
                                                </View>
                                                {method.is_default && (
                                                    <View className="px-4 py-1 bg-primary-100 dark:bg-dark-100 rounded items-center justify-center">
                                                        <Text className="text-xs text-primary-400 dark:text-dark-400 text-center">Default</Text>
                                                    </View>
                                                )}
                                                <View className={`w-5 h-5 rounded-full border-2 ${selectedPaymentMethod === method.id
                                                    ? 'border-primary-500 bg-primary-500 dark:border-dark-500 dark:bg-dark-500'
                                                    : 'border-primary-300 dark:border-dark-300'
                                                    }`}>
                                                    {selectedPaymentMethod === method.id && (
                                                        <View className="w-full h-full items-center justify-center">
                                                            <View className="w-2 h-2 bg-white rounded-full" />
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                        <Button
                                            title="Manage Cards"
                                            style="accent"
                                            customClasses="mt-2"
                                            onPress={() => {
                                                setShowOrderModal(false);
                                                router.push('/(tabs)/Profile');
                                            }}
                                        />
                                    </View>
                                )}
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row space-x-3 mt-2">
                                <View className="flex-1 mr-2">
                                    <Button
                                        title="Cancel"
                                        style="secondary"
                                        onPress={() => setShowOrderModal(false)}
                                        disabled={paymentProcessing}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Button
                                        title={paymentProcessing ? "Processing..." : "Confirm & Pay"}
                                        style="primary"
                                        onPress={handlePlaceOrder}
                                        disabled={paymentProcessing || paymentMethods.length === 0 || getAvailableHours.length === 0}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* replaced by booking button above -- that one could be moved down here?
                <Button
                    title="View Order"
                    style="primary"
                    customClasses="min-w-[60%]"
                    onPress={() => alert("Checkout Placeholder")}
                    disabled={userType === 'chef'}
                />*/}
                <Button
                    title="← Return"
                    style="secondary"
                    onPress={() => router.back()}
                    customClasses="min-w-[60%]"
                />
                <View className="h-8" />
            </ScrollView>
        </>
    );
}