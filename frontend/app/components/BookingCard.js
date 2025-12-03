import React from 'react';
import { View, Text } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import Button from './Button';
import Card from './Card';
// Import Octicons, Button, and Card components
// Import your status color utility functions

const BookingCard = ({
    booking,
    userType,
    onStatusUpdate,
    getStatusColor
}) => {
    const isCustomer = userType === 'customer';

    const displayTitle = isCustomer
        ? booking.chef_name
        : booking.customer_name;

    const parts = booking.booking_date.split('-');
    const bookingDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const formattedDate = bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const finalTitle = `${displayTitle} - ${formattedDate}`;

    return (
        <Card
            key={booking.booking_id}
            title={finalTitle}
            isCollapsible={true}
            startExpanded={false}
        >
            <View className="px-2">

                <View className="flex-row items-center justify-between">
                    <Text className="text-md font-semibold text-primary-400 dark:text-dark-400">
                        {isCustomer ? 'Chef' : 'Customer'}: {displayTitle}
                    </Text>
                    <View className={`${getStatusColor(booking.status)} px-3 py-1 rounded-full`}>
                        <Text className="text-white font-bold capitalize">{booking.status}</Text>
                    </View>
                </View>

                <View className='flex-row justify-between py-1'>
                    <View>
                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                            Booking Date & Time:
                        </Text>
                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                            {booking.booking_date} at {booking.booking_time}
                        </Text>
                    </View>
                    <View>
                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                            Cuisine: {booking.cuisine_type}
                        </Text>
                        <Text className="text-sm text-primary-400 dark:text-dark-400">
                            Meal Type: {booking.meal_type[0].toUpperCase() + booking.meal_type.slice(1)}
                        </Text>
                    </View>
                </View>

                <View className="bg-base-100 dark:bg-base-dark-100 p-2 rounded-lg mt-1">
                    {booking.special_notes && (
                        <Text className="text-sm text-primary-400 dark:text-dark-400 text-center text-wrap">
                            {booking.special_notes}
                        </Text>
                    )}
                </View>

                {booking.total_cost && (
                    <Text className="text-md font-bold text-primary-400 dark:text-dark-400 text-center mt-2">
                        Total: ${booking.total_cost.toFixed(2)}
                    </Text>
                )}

                {isCustomer === false && booking.status === 'pending' && (
                    <View className="flex-row space-x-2 mt-2">
                        <View className="flex-1 mr-2">
                            <Button
                                title="Accept"
                                style="primary"
                                onPress={() => onStatusUpdate(booking.booking_id, 'accepted')}
                            />
                        </View>
                        <View className="flex-1">
                            <Button
                                title="Decline"
                                style="secondary"
                                onPress={() => onStatusUpdate(booking.booking_id, 'declined')}
                            />
                        </View>
                    </View>
                )}

                {isCustomer && booking.status === 'completed' && (
                    <Button title=" Book This Chef Again" style="secondary" href={`/ChefProfileScreen/${booking.chef_id}`} customClasses="mt-2" />
                )}
            </View>
        </Card>
    );
};

export default BookingCard;