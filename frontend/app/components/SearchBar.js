import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Button from './Button';
import Input from './Input';
import CustomPicker from './Picker';
import Stepper from './Stepper';
import LocationInput from './LocationInput';
import getEnvVars from '../../config';
import { useAuth } from '../context/AuthContext';

export default function SearchBarComponent({ formData, setFormData, handleSearch }) {
    const [recentSearches, setRecentSearches] = useState([]);
    const [isDropVisible, setIsDropVisible] = useState(false);
    const { apiUrl } = getEnvVars();
    const { token, profileId } = useAuth();

    // Fetch recent searches from API
    useEffect(() => {
        const fetchRecentSearches = async () => {
            if (!profileId || !token) return;

            try {
                const url = `${apiUrl}/search/recent/${profileId}?limit=3`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Transform API data to match the expected format
                    const formattedSearches = data.recent_searches.map(search => {
                        let query = search.search_query || search.cuisine || 'Recent search';
                        let type = 'chef';
                        
                        if (search.cuisine && !search.search_query) {
                            type = 'cuisine';
                        } else if (search.search_query) {
                            // Try to guess the type based on the query
                            type = 'chef';
                        }

                        return { 
                            query, 
                            type,
                            fullData: search // Keep full search data for re-executing search
                        };
                    });

                    setRecentSearches(formattedSearches);
                }
            } catch (err) {
                console.error('Failed to fetch recent searches:', err);
            }
        };

        fetchRecentSearches();
    }, [profileId, token, apiUrl]);

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
        // Re-apply the full search parameters from history
        if (item.fullData) {
            setFormData(prev => ({
                ...prev,
                searchQuery: item.fullData.search_query || '',
                cuisine: item.fullData.cuisine || '',
                gender: item.fullData.gender || 'all',
                timing: item.fullData.meal_timing || 'all',
                min_rating: item.fullData.min_rating || 0,
                max_price: item.fullData.max_price || 500,
                radius: item.fullData.radius || 10,
                latitude: item.fullData.latitude || prev.latitude,
                longitude: item.fullData.longitude || prev.longitude,
            }));
        } else {
            // Fallback to just setting query and type
            setFormData(prev => ({ ...prev, searchQuery: item.query, searchType: item.type }));
        }
    };

    const renderDropView = () => (
        <View className="flex-1 w-full bg-white dark:bg-black rounded-xl p-3 mt-1 mb-1 pb-0">
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
                <Text className="text-sm font-semibold text-primary-400 mb-1 mt-4 text-center dark:text-dark-400">Recent Searches</Text>
                {recentSearches.length > 0 ? (
                    <View className="rounded-lg border border-gray-100">
                        {recentSearches.map((item, index) => (
                            <TouchableOpacity key={index} onPress={() => handleHistoryClick(item)} className="p-2 border-b border-gray-100 rounded-lg">
                                <Text className="text-base text-warm-gray">{item.query} ({item.type})</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View className="p-3 rounded-lg border border-gray-100">
                        <Text className="text-sm text-gray-500 text-center">No recent searches yet</Text>
                    </View>
                )}
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

            <View className="p-4 pt-2 pb-2 bg-primary-100 rounded-xl shadow-md w-full items-center justify-center shadow-sm shadow-primary-500 dark:bg-dark-100">
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