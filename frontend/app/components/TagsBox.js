import React from 'react';
import { Text, View } from 'react-native';

const THEMES = {
    base: 'bg-base-100 dark:bg-base-dark-100 text-primary-400 dark:text-dark-400',
    light: 'bg-primary-100 dark:bg-dark-100 text-primary-400 dark:text-dark-400',
    dark: 'bg-primary-400 dark:bg-dark-400 text-primary-100 dark:text-dark-100',
};

export default function TagsBox({ words, theme = 'base' }) {
    if (!words || !Array.isArray(words) || words.length === 0) {
        return null;
    }

    const renderWordItem = (word, index) => (
        word !== null &&
        <View
            key={`${word}-${index}`}
            className="p-[2px]"
        >
            <Text className={`text-xs rounded-3xl p-1 ${THEMES[theme]}`}>{word}</Text>
        </View>
    );

    return (
        <View className="flex-row flex-wrap justify-center w-full">
            {words.map(renderWordItem)}
        </View>
    );
};