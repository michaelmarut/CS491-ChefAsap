import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Button from './Button';
import Input from './Input';
import Octicons from '@expo/vector-icons/Octicons';
import LocationInput from './LocationInput';

//mock history
const INITIAL_HISTORY = [
    { query: 'Italian', type: 'cuisine' },
    { query: 'Chef Jane Doe', type: 'chef' },
];

export default function SearchBarComponent({ formData, setFormData, handleSearch }) {
    const [showFilters, setShowFilters] = useState(false);
    const [recentSearches, setRecentSearches] = useState(INITIAL_HISTORY);

    const filterDigits = (text) => text.replace(/[^0-9]/g, '');

    const handlePrimarySearchChange = (value) => {
        setFormData(prev => ({ ...prev, searchQuery: value }));
    };

    const handleHistoryClick = (item) => {
        setFormData(prev => ({ ...prev, searchQuery: item.query, searchType: item.type }));
    };

    const renderFilterModal = () => (
        <Modal
            visible={showFilters}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowFilters(false)}
        >
            <View className="flex-1 bg-base-100 p-5">
                <Text className="text-3xl font-bold text-olive-500 mb-6 mt-4">Advanced Filters</Text>

                <ScrollView className="flex-1">

                    <View className="mb-6">
                        <Text className="text-base font-semibold mb-2 text-olive-400">Search Radius (Miles)</Text>
                        <Input
                            placeholder="e.g., 10"
                            value={String(formData.searchRadius)}
                            onChangeText={(v) => setFormData(prev => ({ ...prev, searchRadius: filterDigits(v) }))}
                            keyboardType="numeric"
                            containerClasses="mb-1"
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-base font-semibold mb-2 text-olive-400">Chef Gender</Text>
                        <View className="border border-gray-300 rounded-lg py-0 bg-white">
                            <Picker
                                selectedValue={formData.gender}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}
                            >
                                <Picker.Item label="Any Gender" value="any" />
                                <Picker.Item label="Male" value="male" />
                                <Picker.Item label="Female" value="female" />
                                <Picker.Item label="Non-Binary" value="non-binary" />
                            </Picker>
                        </View>
                    </View>

                    <View className="mb-6">
                        <Text className="text-base font-semibold mb-2 text-olive-400">Meal Timing</Text>
                        <View className="border border-gray-300 rounded-lg py-0 bg-white">
                            <Picker
                                selectedValue={formData.timing}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, timing: v }))}
                            >
                                <Picker.Item label="Any Time" value="any" />
                                <Picker.Item label="Breakfast" value="breakfast" />
                                <Picker.Item label="Lunch" value="lunch" />
                                <Picker.Item label="Dinner" value="dinner" />
                            </Picker>
                        </View>
                    </View>

                </ScrollView>

                <Button
                    title="Apply Filters and Close"
                    variant="primary"
                    onPress={() => setShowFilters(false)}
                    customClasses="mt-4"
                />
            </View>
        </Modal>
    );

    return (
        <View className="w-full">
            {renderFilterModal()}

            <View className="flex-row items-center space-x-2 mb-4">
                <View className="flex-1">
                    <Input
                        placeholder="Search Chef, Cuisine, or Dish..."
                        value={formData.searchQuery}
                        onChangeText={handlePrimarySearchChange}
                        onFocus={() => { /* logic to show history view */ }}
                        customClasses="pr-10" 
                    />
                </View>
                <TouchableOpacity onPress={handleSearch} className="p-3 bg-olive-400 rounded-lg">
                    <Octicons name="search" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View className="border border-gray-300 rounded-lg py-0 bg-white mb-4">
                <Picker
                    selectedValue={formData.searchType}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, searchType: v }))}
                >
                    <Picker.Item label="Search By: Chef Name" value="chef" />
                    <Picker.Item label="Search By: Cuisine Type" value="cuisine" />
                    <Picker.Item label="Search By: Dish Name" value="dish" />
                </Picker>
            </View>

            <Button
                title="Advanced Filters"
                variant="secondary"
                onPress={() => setShowFilters(true)}
                customClasses="mb-6 w-full"
            />

            <LocationInput
                formData={formData}
                setFormData={setFormData}
                onLocationSelect={(lat, lon, address) => {
                    setFormData(prev => ({ ...prev, latitude: lat, longitude: lon, locationAddress: address }));
                }}
            />

            <View className="mt-4">
                <Text className="text-sm font-semibold text-olive-500 mb-2">Recent Searches:</Text>
                {recentSearches.map((item, index) => (
                    <TouchableOpacity key={index} onPress={() => handleHistoryClick(item)} className="p-2 border-b border-gray-100">
                        <Text className="text-base text-warm-gray">{item.query} ({item.type})</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}