import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
    return (
        <ScrollView className="flex-1 bg-base-100 p-5">
            <Text className="text-base text-warm-gray text-center mt-12"> Profile Picture </Text>
            <Text className="text-base text-warm-gray text-center mt-12"> FirstName LastName </Text>
            <Text className="text-base text-warm-gray text-center mt-12"> Description </Text>
        </ScrollView>
    );

}