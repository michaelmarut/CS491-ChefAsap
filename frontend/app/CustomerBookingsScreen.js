import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Alert, TouchableOpacity, RefreshControl, Modal, TextInput } from "react-native";
import { Stack, useRouter } from 'expo-router';
import { Octicons } from '@expo/vector-icons';

import getEnvVars from "../config";
import { useAuth } from "./context/AuthContext";

import LoadingIcon from "./components/LoadingIcon";
import Button from "./components/Button";
import Card from "./components/Card";
import BookingCard from './components/BookingCard';

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
            case 'accepted': return 'bg-green-500';
            case 'declined': return 'bg-red-500';
            case 'completed': return 'bg-blue-500';
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
                className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-3xl font-bold text-primary-400 dark:text-dark-400">
                        My Bookings
                    </Text>
                    
                </View>

                {/* Bookings List */}
                {bookings.length === 0 ? (
                    <Card title="No Bookings">
                        <Text className="text-center text-primary-400 dark:text-dark-400">
                            No bookings found. Start by searching for a chef!
                        </Text>
                    </Card>
                ) : (
                    bookings.map((booking) =>
                        <BookingCard
                            key={booking.booking_id}
                            booking={booking}
                            userType={userType}
                            onStatusUpdate={() => { }}
                            getStatusColor={getStatusColor}
                        />
                    )
                )}

                <View className="h-24" />
            </ScrollView>
        </>
    );
}
