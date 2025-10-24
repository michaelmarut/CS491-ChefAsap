import React from 'react';
import { Text, View } from 'react-native';

export default function TagsBox({ words }) {
    const renderWordItem = (word, index) => (
        <View
            key={`${word}-${index}`}
            className="p-[2px]"
        >
            <Text className="text-xs bg-base-100 dark:bg-base-dark-100 text-primary-400 dark:text-dark-400 rounded-3xl p-1">{word}</Text>
        </View>
    );

    return (
        <View className="flex-row flex-wrap justify-center w-full">
            {words.map(renderWordItem)}
        </View>
    );
};