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
                Alert.alert('Success', `Booking ${newStatus}`);
                fetchBookings(); // Refresh the list
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
            case 'accepted': return 'bg-blue-500';
            case 'declined': return 'bg-red-500';
            case 'completed': return 'bg-gray-500';
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
                            className={`mr-2 px-4 py-2 rounded-full ${
                                selectedStatus === btn.value 
                                    ? 'bg-lime-600' 
                                    : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                        >
                            <Text className={`${
                                selectedStatus === btn.value 
                                    ? 'text-white font-bold' 
                                    : 'text-primary-400 dark:text-dark-400'
                            }`}>
                                {btn.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Bookings List */}
                {bookings.length === 0 ? (
                    <Card title="No Bookings">
                        <Text className="text-center text-primary-400 dark:text-dark-400">
                            No bookings found for this status.
                        </Text>
                    </Card>
                ) : (
                    bookings.map((booking) => (
                        <Card
                            key={booking.booking_id}
                            title={`Booking #${booking.booking_id}`}
                            isCollapsible={true}
                            startExpanded={false}
                        >
                            <View className="space-y-2">
                                {/* Customer Info */}
                                <View className="bg-primary-50 dark:bg-dark-50 p-3 rounded-lg">
                                    <Text className="text-sm font-semibold text-primary-400 dark:text-dark-400">
                                        Customer: {booking.customer_name}
                                    </Text>
                                    <Text className="text-sm text-primary-400 dark:text-dark-400">
                                        Phone: {booking.customer_phone}
                                    </Text>
                                    <Text className="text-sm text-primary-400 dark:text-dark-400">
                                        Email: {booking.customer_email}
                                    </Text>
                                </View>

                                {/* Booking Details */}
                                <View className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                                    <Text className="text-sm font-semibold text-primary-400 dark:text-dark-400">
                                        Booking Date & Time:
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
                                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                                            Event: {booking.event_type}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                                            People: {booking.number_of_people}
                                        </Text>
                                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                                            Supply: {booking.produce_supply}
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

                                {/* Delivery Address */}
                                {(booking.address_line1 || booking.city) && (
                                    <View className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                                        <Text className="text-sm font-semibold text-primary-400 dark:text-dark-400">
                                            Delivery Address:
                                        </Text>
                                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                                            {booking.address_line1 && `${booking.address_line1}`}
                                            {booking.address_line2 && `, ${booking.address_line2}`}
                                            {(booking.address_line1 || booking.address_line2) && booking.city && ', '}
                                            {booking.city}, {booking.state} {booking.zip_code}
                                        </Text>
                                    </View>
                                )}

                                {/* Action Buttons */}
                                {booking.status === 'pending' && (
                                    <View className="flex-row space-x-2 mt-2">
                                        <View className="flex-1 mr-2">
                                            <Button
                                                title="Accept"
                                                style="primary"
                                                onPress={() => updateBookingStatus(booking.booking_id, 'accepted')}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Button
                                                title="Decline"
                                                style="secondary"
                                                onPress={() => updateBookingStatus(booking.booking_id, 'declined')}
                                            />
                                        </View>
                                    </View>
                                )}

                                {booking.status === 'accepted' && (
                                    <Button
                                        title="Mark as Completed"
                                        style="primary"
                                        onPress={() => updateBookingStatus(booking.booking_id, 'completed')}
                                    />
                                )}
                            </View>
                        </Card>
                    ))
                )}

                <Button
                    title="← Back to Profile"
                    style="secondary"
                    href="/(tabs)/Profile"
                    customClasses="min-w-[60%] mt-4"
                />

                <View className="h-24" />
            </ScrollView>
        </>
    );
}
