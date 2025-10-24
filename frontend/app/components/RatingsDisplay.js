import React from 'react';
import { View } from 'react-native';
import { Octicons } from '@expo/vector-icons';

export default function RatingsDisplay({
    rating
}) {
    return (
        <View className="flex-row justify-center items-center pt-2">
            {Array.from({ length: rating }, (a, i) => i).map((num, index) =>
                <Octicons
                    key={index}
                    name={"star-fill"}
                    size={24}
                    color={"#65A30D"}
                />)}
            {Array.from({ length: 5 - rating }, (a, i) => i).map((num, index) =>
                <Octicons
                    key={index}
                    name={"star"}
                    size={24}
                    color={"#65A30D"}
                />)}
        </View>
    );
}