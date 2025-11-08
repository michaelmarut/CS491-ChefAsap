import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';

/**
 * @typedef {Object} PickerOption
 * @property {string} label - The text displayed to the user.
 * @property {string | number} value - The actual value returned on selection.
 */

/**
 * @typedef {Object} PickerModalProps
 * @property {boolean} isVisible - Controls the visibility of the modal.
 * @property {PickerOption[]} options - Array of options for the picker.
 * @property {(option: PickerOption) => void} onSelect - Callback function when an option is selected.
 * @property {() => void} onClose - Function to call when the modal needs to be closed (Cancel/Overlay tap).
 * @property {string | number | null} selectedValue - The currently selected value.
 * @property {string} [title='Choose an Option'] - Title for the modal pop-up.
 */

/**
 * The Modal component containing the picker list (no external button).
 * @param {PickerModalProps} props
 */
export default function CustomPickerModal ({
    isVisible,
    options,
    onSelect,
    onClose,
    selectedValue,
    title = 'Choose an Option',
}) {
    const handleSelectOption = (option) => {
        onSelect(option);
        onClose(); // Close after selection
    };

    const renderOption = ({ item }) => (
        <TouchableOpacity
            className="p-4 border-b border-gray-200 w-full items-center"
            onPress={() => handleSelectOption(item)}
        >
            <Text
                className={`text-base ${item.value === selectedValue ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`}
            >
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            {/* 1. Full-screen Overlay */}
            <TouchableOpacity
                className="flex-1 justify-center items-center bg-black/60"
                activeOpacity={1}
                onPressOut={onClose} // Close when tapping outside
            >
                {/* 2. Modal Content Box (The Picker Popup) */}
                <View
                    className="bg-white rounded-xl p-6 w-11/12 max-h-3/4 shadow-2xl"
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <Text className="text-xl font-bold mb-4 text-center text-gray-800">
                        {title}
                    </Text>

                    <FlatList
                        data={options}
                        renderItem={renderOption}
                        keyExtractor={(item) => String(item.value)}
                        showsVerticalScrollIndicator={true}
                        className="max-h-64 border border-gray-200 rounded-lg"
                    />

                    {/* 3. Cancel Button */}
                    <TouchableOpacity
                        className="mt-5 bg-gray-200 p-3 rounded-lg w-full items-center"
                        onPress={onClose}
                    >
                        <Text className="text-base font-semibold text-gray-700">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};