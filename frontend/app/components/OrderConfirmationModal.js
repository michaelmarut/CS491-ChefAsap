import React, { useState } from 'react';
import { Modal, View, Text, Alert } from 'react-native';

import { useAuth } from '../context/AuthContext';
import getEnvVars from '../../config';

import Button from './Button';
import Input from './Input';
import ProfilePicture from './ProfilePicture';

function formatDate(dateString) {
    if (!dateString) return 'Invalid Date';

    const parts = dateString.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);

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

export default function OrderConfirmationModal({
    onClose,
    booking,
}) {
    const { token } = useAuth();
    const { apiUrl } = getEnvVars();
    const [review, setReview] = useState('');
    const [confirmation, setConfirmation] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleReview = async () => {
        try {
            setLoading(true)
            const bookingResponse = await fetch(`${apiUrl}/booking/complete/${booking.booking_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (!bookingResponse.ok) {
                const bookingData = await bookingResponse.json();
                console.log(bookingData.error)
                Alert.alert('Error', bookingData.error || 'Failed to review chef.');
            }
        } catch (err) {
            Alert.alert('Error', 'Network error. Could not add review for chef.');
            console.error('Review error:', err);
        } finally {
            setLoading(false)
            onClose();
        }
    };

    return (

        <View className='h-full flex items-center justify-center px-4'>
            <View className='bg-base-100 dark:bg-base-dark-100 border-4 border-primary-400 darK:border-dark-400 rounded-xl p-4'>
                <Text className='text-center text-3xl font-semibold text-primary-400 dark:text-dark-400 mb-2'>Confirming Booking With</Text>
                <Text className='text-center text-2xl font-medium text-primary-400 dark:text-dark-400 mb-2'>{booking.customer_name}</Text>
                <ProfilePicture photoUrl={booking.customer_photo} firstName={booking.customer_name.split(" ")[0]} lastName={booking.customer_name.split(" ")[-1]} />
                <Text className='text-center text-xl font-medium text-primary-400 dark:text-dark-400 mt-2'>{formatDate(booking.booking_date)} - {formatTime(booking.booking_time)}</Text>
                <Text className='text-center text-md text-primary-400 dark:text-dark-400 text-wrap'>{booking.special_notes}</Text>
                
                <Text className='text-center text-xl font-medium text-primary-400 dark:text-dark-400 mt-2 border-primary-400 dark:border-dark-400 border-t-2 py-2'>Did the booking go successfully?</Text>
                <View className='flex-row w-full items-center justify-between'>
                    <Button
                        title="Yes"
                        customClasses='w-[49%]'
                        onPress={() => setConfirmation(true)}
                        style={'secondary'}
                        disabled={confirmation}
                    />
                    <Button
                        title="No"
                        customClasses='w-[49%]'
                        onPress={() => setConfirmation(false)}
                        style={'secondary'}
                        disabled={confirmation != null && !confirmation}
                    />
                </View>
                {confirmation != null && !confirmation &&
                    <View className='pt-2'>
                        <Text className='text-center text-xl font-medium text-primary-400 dark:text-dark-400'>What went wrong?</Text>
                        <Input
                            value={review}
                            onChangeText={setReview}
                            placeholder="Write a comment"
                            isTextArea={true}
                            maxLength={1000}
                            multiline={true}
                        />
                        <Text className="text-sm text-right text-gray-500 mb-1 dark:text-gray-400">
                            {review.length}/1000
                        </Text>
                    </View>}
                <Button
                    title="Submit Confirmation"
                    onPress={handleReview}
                    disabled={confirmation == null || loading}
                />
            </View>
        </View>
    );
};