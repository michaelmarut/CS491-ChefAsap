import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function BookingsScreen() {
    return (
        <ScrollView className="flex-1 bg-base-100 p-5">
            <Text className="text-base text-warm-gray text-center mt-12">Previous Bookings</Text>
            <Text className="text-base text-warm-gray text-center mt-12">Today's Bookings</Text>
            <Text className="text-base text-warm-gray text-center mt-12">Upcoming Bookings</Text>
        </ScrollView>
    );

}