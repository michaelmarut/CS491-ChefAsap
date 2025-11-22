import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Alert, TouchableOpacity, RefreshControl, Modal, TextInput } from "react-native";
import { Stack, useRouter } from 'expo-router';
import { Octicons } from '@expo/vector-icons';

import getEnvVars from "../config";
import { useAuth } from "./context/AuthContext";

import LoadingIcon from "./components/LoadingIcon";
import Button from "./components/Button";
import Card from "./components/Card";

export default function CustomerBookingsScreen() {
    const { token, profileId, userType } = useAuth();
    const { apiUrl } = getEnvVars();
    const router = useRouter();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reviewModal, setReviewModal] = useState({ visible: false, booking: null });
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const fetchBookings = async () => {
        try {
            console.log('[CustomerBookingsScreen] Starting fetchBookings...');
            console.log('[CustomerBookingsScreen] profileId:', profileId);
            console.log('[CustomerBookingsScreen] userType:', userType);
            
            setLoading(true);
            
            const url = `${apiUrl}/booking/customer/${profileId}/dashboard`;

            console.log('[CustomerBookingsScreen] Fetching from URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('[CustomerBookingsScreen] Response status:', response.status);
            const data = await response.json();
            console.log('[CustomerBookingsScreen] Response data:', data);

            if (response.ok) {
                // Combine all bookings from dashboard
                const allBookings = [
                    ...(data.data?.previous_bookings || []),
                    ...(data.data?.todays_bookings || []),
                    ...(data.data?.upcoming_bookings || [])
                ];
                console.log('[CustomerBookingsScreen] Setting bookings:', allBookings.length, 'bookings');
                setBookings(allBookings);
            } else {
                console.error('[CustomerBookingsScreen] Error response:', data);
                Alert.alert('Error', data.error || 'Failed to load bookings');
            }
        } catch (error) {
            console.error('[CustomerBookingsScreen] Fetch error:', error);
            Alert.alert('Error', 'Network error. Could not load bookings.');
        } finally {
            console.log('[CustomerBookingsScreen] Setting loading to false');
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (userType !== 'customer') {
            Alert.alert('Access Denied', 'Only customers can view this page');
            router.back();
            return;
        }
        fetchBookings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const openReviewModal = (booking) => {
        setReviewModal({ visible: true, booking });
        setRating(0);
        setReviewText('');
    };

    const closeReviewModal = () => {
        setReviewModal({ visible: false, booking: null });
        setRating(0);
        setReviewText('');
    };

    const submitReview = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a rating');
            return;
        }

        if (!reviewText.trim()) {
            Alert.alert('Error', 'Please write a review');
            return;
        }

        setSubmittingReview(true);
        try {
            const response = await fetch(`${apiUrl}/rating/chef/${reviewModal.booking.chef_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    customer_id: profileId,
                    rating: rating,
                    review: reviewText,
                    booking_id: reviewModal.booking.booking_id
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'Thank you for your review!');
                closeReviewModal();
                fetchBookings(); // Refresh the list
            } else {
                Alert.alert('Error', data.error || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            Alert.alert('Error', 'Network error. Could not submit review.');
        } finally {
            setSubmittingReview(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500';
            case 'accepted': return 'bg-blue-500';
            case 'declined': return 'bg-red-500';
            case 'completed': return 'bg-gray-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    if (loading && !refreshing) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100">
                    <LoadingIcon message="Loading bookings..." />
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView 
                className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-12"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-3xl font-bold text-primary-400 dark:text-dark-400">
                        My Bookings
                    </Text>
                    <TouchableOpacity onPress={onRefresh}>
                        <Octicons name="sync" size={24} color="#4d7c0f" />
                    </TouchableOpacity>
                </View>

                {/* Bookings List */}
                {bookings.length === 0 ? (
                    <Card title="No Bookings">
                        <Text className="text-center text-primary-400 dark:text-dark-400">
                            No bookings found. Start by searching for a chef!
                        </Text>
                    </Card>
                ) : (
                    bookings.map((booking) => {
                        // Format the title as "Chef Name - Date"
                        const bookingDate = new Date(booking.booking_date);
                        const formattedDate = bookingDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                        });
                        const statusText = booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : '';
                        const displayTitle = booking.chef_name && booking.booking_date
                            ? `${booking.chef_name} - ${formattedDate}`
                            : `Booking #${booking.booking_id}`;
                        const titleWithStatus = `${displayTitle} - ${statusText}`;

                        return (
                        <Card
                            key={booking.booking_id}
                            title={titleWithStatus}
                            isCollapsible={true}
                            startExpanded={false}
                        >
                            <View className="space-y-2">
                                {/* Chef Info */}
                                <View className="bg-primary-50 dark:bg-dark-50 p-3 rounded-lg">
                                    <Text className="text-sm font-semibold text-primary-400 dark:text-dark-400">
                                        Chef: {booking.chef_name}
                                    </Text>
                                </View>

                                {/* Booking Details */}
                                <View className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                                    <Text className="text-sm font-semibold text-primary-400 dark:text-dark-400">
                                        Pick Up Time:
                                    </Text>
                                    <Text className="text-sm text-primary-400 dark:text-dark-400">
                                        {booking.booking_date} at {booking.booking_time}
                                    </Text>
                                </View>

                                <View className="flex-row justify-between">
                                    <View>
                                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                                            Cuisine: {booking.cuisine_type}
                                        </Text>
                                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                                            Meal Type: {booking.meal_type}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                                            People: {booking.number_of_people}
                                        </Text>
                                    </View>
                                </View>

                                {/* Total Cost */}
                                {booking.total_cost && (
                                    <Text className="text-xl font-bold text-primary-400 dark:text-dark-400">
                                        Total: ${booking.total_cost.toFixed(2)}
                                    </Text>
                                )}

                                {/* Status Badge */}
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-sm text-primary-400 dark:text-dark-400">
                                        Status:
                                    </Text>
                                    <View className={`${getStatusColor(booking.status)} px-3 py-1 rounded-full`}>
                                        <Text className="text-white font-bold capitalize">
                                            {booking.status}
                                        </Text>
                                    </View>
                                </View>

                                {/* Special Notes */}
                                {booking.special_notes && (
                                    <View className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg">
                                        <Text className="text-sm font-semibold text-primary-400 dark:text-dark-400">
                                            Special Notes:
                                        </Text>
                                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                                            {booking.special_notes}
                                        </Text>
                                    </View>
                                )}

                                {/* Chef Location */}
                                <View className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                                    <Text className="text-sm font-semibold text-primary-400 dark:text-dark-400">
                                        Pick Up Location:
                                    </Text>
                                    {booking.chef_address_line1 ? (
                                        <View>
                                            <Text className="text-sm text-primary-400 dark:text-dark-400">
                                                {booking.chef_address_line1}
                                            </Text>
                                            {booking.chef_address_line2 && (
                                                <Text className="text-sm text-primary-400 dark:text-dark-400">
                                                    {booking.chef_address_line2}
                                                </Text>
                                            )}
                                            <Text className="text-sm text-primary-400 dark:text-dark-400">
                                                {booking.chef_city}, {booking.chef_state} {booking.chef_zip_code}
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                                            Address not available - Please contact chef
                                        </Text>
                                    )}
                                </View>

                                {/* Leave Review Button for Completed Bookings */}
                                {booking.status === 'completed' && !booking.has_reviewed && (
                                    <Button
                                        title="Leave a Review"
                                        style="primary"
                                        onPress={() => openReviewModal(booking)}
                                        customClasses="mt-2"
                                    />
                                )}

                                {/* Already Reviewed Message */}
                                {booking.status === 'completed' && booking.has_reviewed && (
                                    <View className="bg-green-50 dark:bg-green-900 p-3 rounded-lg mt-2">
                                        <Text className="text-sm text-center text-green-700 dark:text-green-300 font-semibold">
                                            ✓ You have already reviewed this booking
                                        </Text>
                                    </View>
                                )}

                                {/* Rebook Button for Completed Bookings */}
                                {booking.status === 'completed' && (
                                    <Button
                                        title=" Book This Chef Again"
                                        style="secondary"
                                        href={`/ChefProfileScreen/${booking.chef_id}`}
                                        customClasses="mt-2"
                                    />
                                )}
                            </View>
                        </Card>
                        );
                    })
                )}

                <Button
                    title="← Back to Profile"
                    style="secondary"
                    href="/(tabs)/Profile"
                    customClasses="min-w-[60%] mt-4"
                />

                <View className="h-24" />
            </ScrollView>

            {/* Review Modal */}
            <Modal 
                visible={reviewModal.visible} 
                transparent 
                animationType="slide" 
                onRequestClose={closeReviewModal}
            >
                <View style={{ flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 8, textAlign: 'center' }}>
                            Leave a Review
                        </Text>
                        
                        {reviewModal.booking && (
                            <Text style={{ fontSize: 16, color: '#4b5563', textAlign: 'center', marginBottom: 16 }}>
                                for {reviewModal.booking.chef_name}
                            </Text>
                        )}

                        {/* Star Rating */}
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 14, color: '#374151', marginBottom: 10 }}>
                                Tap to rate:
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => setRating(star)}
                                        style={{ padding: 4 }}
                                    >
                                        <Octicons 
                                            name={star <= rating ? "star-fill" : "star"} 
                                            size={40} 
                                            color={star <= rating ? "#eab308" : "#d1d5db"} 
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {rating > 0 && (
                                <Text style={{ fontSize: 16, color: '#4d7c0f', marginTop: 8, fontWeight: '600' }}>
                                    {rating} {rating === 1 ? 'star' : 'stars'}
                                </Text>
                            )}
                        </View>

                        {/* Review Text */}
                        <Text style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                            Write your review:
                        </Text>
                        <TextInput
                            value={reviewText}
                            onChangeText={setReviewText}
                            placeholder="Share your experience with this chef..."
                            style={{ 
                                borderWidth: 1, 
                                borderColor: '#e5e7eb', 
                                borderRadius: 8, 
                                padding: 12, 
                                minHeight: 120, 
                                textAlignVertical: 'top',
                                fontSize: 14
                            }}
                            multiline
                            maxLength={500}
                        />
                        <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 4 }}>
                            {reviewText.length}/500
                        </Text>

                        {/* Action Buttons */}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                            <TouchableOpacity 
                                onPress={closeReviewModal} 
                                style={{ 
                                    flex: 1, 
                                    padding: 14, 
                                    borderRadius: 8, 
                                    borderWidth: 1, 
                                    borderColor: '#d1d5db',
                                    alignItems: 'center' 
                                }}
                            >
                                <Text style={{ fontSize: 16, color: '#4b5563', fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={submitReview} 
                                disabled={submittingReview}
                                style={{ 
                                    flex: 1, 
                                    padding: 14, 
                                    borderRadius: 8, 
                                    backgroundColor: submittingReview ? '#9ca3af' : '#65a30d',
                                    alignItems: 'center' 
                                }}
                            >
                                <Text style={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}>
                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}
