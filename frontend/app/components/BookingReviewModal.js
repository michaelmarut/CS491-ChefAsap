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

export default function BookingReviewModal({
    onClose,
    customerId,
    booking,
}) {
    const { token } = useAuth();
    const { apiUrl } = getEnvVars();
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReview = async () => {
        try {
            setLoading(true)
            const bookingResponse = await fetch(`${apiUrl}/rating/chef/${booking.chef_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    booking_id: booking.booking_id,
                    rating: rating,
                    review: review,
                }),
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
                <Text className='text-center text-3xl font-semibold text-primary-400 dark:text-dark-400 mb-2'>Reviewing: {booking.chef_name}</Text>
                <ProfilePicture photoUrl={booking.chef_photo} firstName={booking.chef_name.split(" ")[0]} lastName={booking.chef_name.split(" ")[-1]} />
                <Text className='text-center text-xl font-medium text-primary-400 dark:text-dark-400 mt-2'>{formatDate(booking.booking_date)} - {formatTime(booking.booking_time)}</Text>
                <Text className='text-center text-md text-primary-400 dark:text-dark-400 text-wrap'>{booking.special_notes}</Text>
                <View className='flex-row items-center justify-center border-primary-400 dark:border-dark-400 border-t-2 mt-2 pt-2'>
                    {Array.from({ length: 5 }, (_, i) => i).map((index) =>
                        <Button
                            key={index}
                            style='secondary'
                            base='icon'
                            customClasses='h-12 w-12 border-0 border-transparent shadow-none bg-transparent'
                            iconSize={32}
                            onPress={() => { setRating(index + 1) }}
                            icon={index + 1 <= rating ? 'star-fill' : 'star'}
                        />
                    )}
                </View>
                <View className='pt-2'>
                    <Input
                        value={review}
                        onChangeText={setReview}
                        placeholder="Write a review about the chef and the food."
                        isTextArea={true}
                        maxLength={1000}
                        multiline={true}
                    />
                    <Text className="text-sm text-right text-gray-500 mb-1 dark:text-gray-400">
                        {review.length}/1000
                    </Text>
                </View>
                <Button
                    title="Submit Review"
                    onPress={handleReview}
                    disabled={loading}
                />
            </View>
        </View>
    );
};