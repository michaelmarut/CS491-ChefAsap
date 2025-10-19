import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Button from './Button';
import Input from './Input';
import CustomPicker from './Picker';
import Stepper from './Stepper';
import LocationInput from './LocationInput';

//mock history
const INITIAL_HISTORY = [
    { query: 'Italian', type: 'cuisine' },
    { query: 'Jane Doe', type: 'chef' },
    { query: 'Burger', type: 'dish' },
];

export default function SearchBarComponent({ formData, setFormData, handleSearch }) {
    const [recentSearches, setRecentSearches] = useState(INITIAL_HISTORY);
    const [isDropVisible, setIsDropVisible] = useState(false);

    const genderItems = [
        { label: "All", value: "all" },
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
    ];

    const timingItems = [
        { label: "All", value: "all" },
        { label: "Breakfast", value: "breakfast" },
        { label: "Lunch", value: "lunch" },
        { label: "Dinner", value: "dinner" },
    ];

    const searchOptions = [
        { label: "Chef", value: "chef" },
        { label: "Cuisine", value: "cuisine" },
        { label: "Dish", value: "dish" },
    ]

    const filterDigits = (text) => text.replace(/[^0-9]/g, '');

    const handlePrimarySearchChange = (value) => {
        setFormData(prev => ({ ...prev, searchQuery: value }));
    };

    const handleHistoryClick = (item) => {
        setFormData(prev => ({ ...prev, searchQuery: item.query, searchType: item.type }));
    };

    const renderDropView = () => (
        <View className="flex-1 w-full bg-white rounded-xl p-3 mt-1 mb-1 pb-0">
            <View className="flex-row">
                <CustomPicker
                    label="Search By"
                    prompt="Select what to search by"
                    selectedValue={formData.searchType}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, searchType: v }))}
                    items={searchOptions}
                    labelStyle='text-center'
                />
                <Stepper
                    label="Search Radius"
                    value={formData.radius}
                    onValueChange={(newValue) => setFormData(prev => ({ ...prev, radius: newValue }))}
                    min={5}
                    max={30}
                    step={5}
                    labelStyle='text-center'
                />
            </View>

            <View className="flex-row">
                <CustomPicker
                    label="Meal Timing"
                    prompt="Select Mealtime"
                    selectedValue={formData.timing}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, timing: v }))}
                    items={timingItems}
                    labelStyle='text-center'
                />
                <CustomPicker
                    label="Chef Gender"
                    prompt="Select Gender"
                    selectedValue={formData.gender}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}
                    items={genderItems}
                    labelStyle='text-center'
                />
            </View>
            <View>
                <Text className="text-sm font-semibold text-olive-400 mb-1 mt-4 text-center">Recent Searches</Text>
                <View className="rounded-lg border border-gray-100">
                    {recentSearches.map((item, index) => (
                        <TouchableOpacity key={index} onPress={() => handleHistoryClick(item)} className="p-2 border-b border-gray-100 rounded-lg">
                            <Text className="text-base text-warm-gray">{item.query} ({item.type})</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View>
                <Button
                    icon='chevron-up'
                    onPress={() => setIsDropVisible(false)}
                    style='secondary'
                    customClasses='mt-1 bg-transparent border-transparent shadow-none'
                />
            </View>
        </View>
    );

    return (
        <View className="w-full flex-1 gap-y-4 pb-4">

            <View className="p-4 pt-2 pb-2 bg-olive-100 rounded-xl shadow-md w-full items-center justify-center shadow-sm shadow-olive-500">
                <View className="flex-row">
                    <Input
                        placeholder={`Search ${formData.searchType}...`}
                        value={formData.searchQuery}
                        onChangeText={handlePrimarySearchChange}
                        onFocus={() => setIsDropVisible(true)}
                        containerClasses='w-[88%]'
                    />
                    <Button
                        icon={"search"}
                        onPress={() => { handleSearch(); setIsDropVisible(false); }}
                        style='accent'
                        customClasses='rounded-lg w-12 h-12 m-1'
                    />
                </View>
                {isDropVisible && renderDropView()}

            </View>

            <View>
                <LocationInput
                    formData={formData}
                    setFormData={setFormData}
                    onLocationSelect={(lat, lon, address) => {
                        setFormData(prev => ({ ...prev, latitude: lat, longitude: lon, locationAddress: address }));
                    }}
                />
            </View>
        </View>
    );
}