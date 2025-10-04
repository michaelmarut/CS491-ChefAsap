import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';

/**
 * A generalized, styled text input component.
 * @param {string} label - Text label displayed above the input.
 * @param {string} error - Optional error message displayed below the input.
 * @param {string} containerClasses - Optional NativeWind classes for the surrounding View.
 * @param {boolean} isTextArea - If true, applies styling for a multi-line text area.
 * @param {object} props - All standard React Native TextInput props (value, onChangeText, etc.).
 */
export default function Input({
    label, // input label
    error, // error message
    containerClasses = "mb-2", // optional container classes
    isTextArea = false, // allows for multi-line input
    secureTextEntry, //allows for password hiding
    ...props // standard TextInput props
}) {
    const isPasswordField = secureTextEntry === true;
    const [isPasswordVisible, setIsPasswordVisible] = useState(isPasswordField);
    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prev => !prev);
    };

    const baseClasses = "border border-olive-100 bg-white rounded-full py-3 px-4 text-base text-olive-500";
    const finalInputClasses = isTextArea
        ? `${baseClasses.replace('rounded-full', 'rounded-lg')} h-24 text-top`
        : `${baseClasses} rounded-full`;
    
    const finalSecureTextEntry = isPasswordField && isPasswordVisible;

    const eyeLocation = label ? 'top-[37px]' : 'top-[2px]';

    return (
        <View className={containerClasses}>
            {label && (
                <Text className="text-sm font-semibold mb-1 mt-2 text-olive-400">
                    {label}
                </Text>
            )}

            <TextInput
                className={finalInputClasses}
                placeholderTextColor="#6b7280" // base-200
                style={isTextArea ? { textAlignVertical: 'top' } : {}}
                secureTextEntry={finalSecureTextEntry} 
                {...props}
            />

            {isPasswordField && (
                <TouchableOpacity
                    onPress={togglePasswordVisibility}
                    className= {`absolute right-0 p-3 ${eyeLocation}`} 
                >
                    <Octicons
                        name={isPasswordVisible ? 'eye' : 'eye-closed'}
                        size={20}
                        color="#78716c" // warm gray
                    />
                </TouchableOpacity>
            )}

            {error ? (
                <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>
            ) : null}
        </View>
    );
}