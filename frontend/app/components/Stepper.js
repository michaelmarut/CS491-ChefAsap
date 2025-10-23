import React from 'react';
import { View, Text } from 'react-native';
import Button from './Button';

export default function Stepper({
    label, // optional text above stepper
    value, // stepper value passed as prop
    onValueChange, // stepper value changer passed as prop
    min = 0, // stepper min
    max = 100, // stepper max
    step = 1, // stepper increment
    labelStyle = '', // optional label styles
}) {
    const numericValue = Number(value);

    const handleIncrement = () => {
        const newValue = Math.min(max, numericValue + step);
        onValueChange(newValue);
    };

    const handleDecrement = () => {
        const newValue = Math.max(min, numericValue - step);
        onValueChange(newValue);
    };

    return (
        <View className="">
            {label && <Text className={`text-sm font-semibold mb-1 mt-2 text-primary-400 dark:text-dark-400 ${labelStyle}`}>{label}</Text>}
            <View className="flex-row items-center justify-center space-x-1">
                <View>
                    <Button
                        icon="dash"
                        onPress={handleDecrement}
                        disabled={numericValue <= min}
                        customClasses='rounded-lg w-12 h-12 m-1'
                    />
                </View>
                <View className="w-12 h-12 flex items-center justify-center border-2 border-primary-300 rounded-lg bg-primary-100 shadow-sm shadow-primary-500 dark:border-dark-300 dark:bg-dark-100">
                    <Text className="text-xl font-bold text-primary-500">{numericValue}</Text>
                </View>
                <View>
                    <Button
                        icon="plus"
                        onPress={handleIncrement}
                        disabled={numericValue >= max}
                        customClasses='rounded-lg w-12 h-12 m-1'
                    />
                </View>
            </View>
        </View>
    );
}