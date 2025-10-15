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
            {label && <Text className={`text-sm font-semibold mb-1 mt-2 text-olive-400 ${labelStyle}`}>{label}</Text>}
            <View className="flex-row items-center justify-center space-x-1">
                <View>
                    <Button
                        icon="dash"
                        onPress={handleDecrement}
                        disabled={numericValue <= min}
                        customClasses='rounded-lg w-12 h-12 m-1'
                    />
                </View>
                <View className="w-12 h-12 flex items-center justify-center border-2 border-olive-300 rounded-lg bg-olive-100 shadow-sm shadow-olive-500">
                    <Text className="text-xl font-bold text-olive-500">{numericValue}</Text>
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