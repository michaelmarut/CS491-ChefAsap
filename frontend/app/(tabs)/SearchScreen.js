import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function SearchScreen() {
    return (
        <ScrollView className="flex-1 bg-base-100 p-5">
            <Text className="text-base text-warm-gray text-center mt-12">Welcome User</Text>
            <Text className="text-base text-warm-gray text-center mt-12">Searchbar</Text>
            <Text className="text-base text-warm-gray text-center mt-12">Favorite Chefs</Text>
            <Text className="text-base text-warm-gray text-center mt-12">Recent Chefs</Text>
            <Text className="text-base text-warm-gray text-center mt-12">Nearby Chefs</Text>
        </ScrollView>
    );

}