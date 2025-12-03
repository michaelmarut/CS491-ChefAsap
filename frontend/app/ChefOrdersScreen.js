import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Alert, TouchableOpacity, RefreshControl } from "react-native";
import { Stack, useRouter } from 'expo-router';
import { Octicons } from '@expo/vector-icons';

import getEnvVars from "../config";
import { useAuth } from "./context/AuthContext";

import LoadingIcon from "./components/LoadingIcon";
import Button from "./components/Button";
import Card from "./components/Card";
import CalendarConnectButton from "./components/CalendarConnectButton";
import CalendarIcsUploadButton from "./components/CalendarIcsUploadButton";
import BookingCard from "./components/BookingCard";

export default function ChefOrdersScreen() {
    const { token, profileId, userType } = useAuth();
    const { apiUrl } = getEnvVars();
    const router = useRouter();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('all');

    const fetchBookings = async () => {
        try {
            console.log('[ChefOrdersScreen] Starting fetchBookings...');
            console.log('[ChefOrdersScreen] profileId:', profileId);
            console.log('[ChefOrdersScreen] userType:', userType);
            console.log('[ChefOrdersScreen] selectedStatus:', selectedStatus);

            setLoading(true);

            const url = selectedStatus === 'all'
                ? `${apiUrl}/booking/chef/${profileId}/bookings`
                : `${apiUrl}/booking/chef/${profileId}/bookings?status=${selectedStatus}`;

            console.log('[ChefOrdersScreen] Fetching from URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('[ChefOrdersScreen] Response status:', response.status);
            const data = await response.json();
            console.log('[ChefOrdersScreen] Response data:', data);

            if (response.ok) {
                console.log('[ChefOrdersScreen] Setting bookings:', data.bookings?.length || 0, 'bookings');
                setBookings(data.bookings || []);
            } else {
                console.error('[ChefOrdersScreen] Error response:', data);
                Alert.alert('Error', data.error || 'Failed to load bookings');
            }
        } catch (error) {
            console.error('[ChefOrdersScreen] Fetch error:', error);
            Alert.alert('Error', 'Network error. Could not load bookings.');
        } finally {
            console.log('[ChefOrdersScreen] Setting loading to false');
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (userType !== 'chef') {
            Alert.alert('Access Denied', 'Only chefs can view this page');
            router.back();
            return;
        }
        fetchBookings();
    }, [selectedStatus]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const updateBookingStatus = async (bookingId, newStatus) => {
        try {
            const response = await fetch(`${apiUrl}/booking/booking/${bookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (response.ok) {
                //Alert.alert('Success', `Booking ${newStatus}`);
                onRefresh(); // Refresh the list
            } else {
                Alert.alert('Error', data.error || 'Failed to update booking');
            }
        } catch (error) {
            console.error('Error updating booking:', error);
            Alert.alert('Error', 'Network error. Could not update booking.');
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

    const statusButtons = [
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Completed', value: 'completed' },
        { label: 'Declined', value: 'declined' },
    ];

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

                {/* Calendar Integration */}
                <Card
                    title="Calendar Sync"
                    headerIcon="calendar"
                    isCollapsible={true}
                    startExpanded={false}
                    customClasses="mb-4"
                >
                    <View className="space-y-3">
                        <Text className="text-sm text-primary-400 dark:text-dark-400 mb-2">
                            Connect your Google Calendar to sync bookings automatically
                        </Text>
                        <CalendarConnectButton
                            onSynced={(data) => {
                                Alert.alert('Success', `Synced ${data.count || 0} events from Google Calendar`);
                                fetchBookings(); // Refresh bookings after sync
                            }}
                        />
                        <View className="border-t border-primary-200 dark:border-dark-200 my-3" />
                        <Text className="text-sm text-primary-400 dark:text-dark-400 mb-2">
                            Or import bookings from an .ics calendar file
                        </Text>
                        <CalendarIcsUploadButton
                            onUploaded={(count) => {
                                Alert.alert('Success', `Imported ${count} events from .ics file`);
                                fetchBookings(); // Refresh bookings after import
                            }}
                        />
                    </View>
                </Card>

                {/* Status Filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                >
                    {statusButtons.map((btn) => (
                        <TouchableOpacity
                            key={btn.value}
                            onPress={() => setSelectedStatus(btn.value)}
                            className={`mr-2 px-4 py-2 rounded-full ${selectedStatus === btn.value
                                    ? 'bg-lime-600'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        >
                            <Text className={`${selectedStatus === btn.value
                                    ? 'text-white font-bold'
                                    : 'text-primary-400 dark:text-dark-400'
                                }`}>
                                {btn.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {loading && !refreshing ? <LoadingIcon message="Loading bookings..." /> :
                    bookings.length === 0 ? (
                        <Card title="No Bookings">
                            <Text className="text-center text-primary-400 dark:text-dark-400">
                                No bookings found for this status.
                            </Text>
                        </Card>
                    ) : (
                        bookings.map((booking) =>
                            <BookingCard
                                key={booking.booking_id}
                                booking={booking}
                                userType={userType}
                                onStatusUpdate={updateBookingStatus}
                                onReviewOpen={() => { }}
                                getStatusColor={getStatusColor}
                            />
                        )
                    )
                }

                <View className="h-8" />
            </ScrollView>
        </>
    );
}
