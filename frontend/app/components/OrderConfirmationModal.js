import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';

import { useAuth } from '../context/AuthContext';
import getEnvVars from '../../config';

import Button from './Button';
import Input from './Input';
import ProfilePicture from './ProfilePicture';

function formatDate(dateString) {
    if (!dateString) return 'Invalid Date';
    // Parse as local date to avoid timezone offset issues
    // dateString format: "YYYY-MM-DD"
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

function formatTime(timeString) {
    if (!timeString) return 'Invalid Time';
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const dummyDate = new Date();
    dummyDate.setHours(hours, minutes, 0);
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return new Intl.DateTimeFormat('en-US', options).format(dummyDate);
}

export default function OrderConfirmationModal({ onClose, booking }) {
    const { token } = useAuth();
    const { apiUrl } = getEnvVars();
    const [comment, setComment] = useState('');
    const [confirmation, setConfirmation] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/booking/complete/${booking.booking_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (!response.ok) {
                const data = await response.json();
                Alert.alert('Error', data.error || 'Failed to complete booking.');
            } else {
                Alert.alert('Success', 'Booking confirmation submitted successfully.');
                onClose();
            }
        } catch (err) {
            Alert.alert('Error', 'Network error. Could not submit confirmation.');
            console.error('Confirmation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const customerFirstName = booking.customer_name?.split(' ')[0] || '';
    const customerLastName = booking.customer_name?.split(' ').slice(1).join(' ') || '';

    return (
        <View className="h-full flex items-center justify-center px-4">
            <View className="bg-base-100 dark:bg-base-dark-100 border-4 border-primary-400 dark:border-dark-400 rounded-xl p-4">
                <Text className="text-center text-3xl font-semibold text-primary-400 dark:text-dark-400 mb-2">
                    Confirming Booking With
                </Text>
                <Text className="text-center text-2xl font-medium text-primary-400 dark:text-dark-400 mb-2">
                    {booking.customer_name}
                </Text>
                <ProfilePicture 
                    photoUrl={booking.customer_photo} 
                    firstName={customerFirstName} 
                    lastName={customerLastName} 
                />
                <Text className="text-center text-xl font-medium text-primary-400 dark:text-dark-400 mt-2">
                    {formatDate(booking.booking_date)} - {formatTime(booking.booking_time)}
                </Text>
                {booking.special_notes && (
                    <Text className="text-center text-md text-primary-400 dark:text-dark-400 text-wrap">
                        {booking.special_notes}
                    </Text>
                )}
                
                <Text className="text-center text-xl font-medium text-primary-400 dark:text-dark-400 mt-2 border-primary-400 dark:border-dark-400 border-t-2 py-2">
                    Did the booking go successfully?
                </Text>
                <View className="flex-row w-full items-center justify-between">
                    <Button
                        title="Yes"
                        customClasses="w-[49%]"
                        onPress={() => setConfirmation(true)}
                        style="secondary"
                        disabled={confirmation === true}
                    />
                    <Button
                        title="No"
                        customClasses="w-[49%]"
                        onPress={() => setConfirmation(false)}
                        style="secondary"
                        disabled={confirmation === false}
                    />
                </View>
                {confirmation === false && (
                    <View className="pt-2">
                        <Text className="text-center text-xl font-medium text-primary-400 dark:text-dark-400">
                            What went wrong?
                        </Text>
                        <Input
                            value={comment}
                            onChangeText={setComment}
                            placeholder="Write a comment"
                            isTextArea={true}
                            maxLength={1000}
                            multiline={true}
                        />
                        <Text className="text-sm text-right text-gray-500 mb-1 dark:text-gray-400">
                            {comment.length}/1000
                        </Text>
                    </View>
                )}
                <Button
                    title="Submit Confirmation"
                    onPress={handleSubmit}
                    disabled={confirmation == null || loading}
                />
            </View>
        </View>
    );
}