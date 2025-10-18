import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import Card from "../components/Card";
import Button from '../components/Button';
import LoadingIcon from "../components/LoadingIcon";
import SearchBarComponent from '../components/SearchBar';
import SearchResultCard from '../components/SearchResultCard';

const SEARCH_RESULTS = [
    { chef_id: 5, distance: 1.1, cuisine: ["Italian"], timing: ["Lunch"], rating: 5 },
    { chef_id: 6, distance: 1.7, cuisine: ["French", "Italian"], timing: ["Lunch", "Dinner"], rating: 3 },
    { chef_id: 7, distance: 2.2, cuisine: ["Italian", "Vietnamese"], timing: ["Lunch", "Dinner"], rating: 4 },
];

export default function SearchScreen() {
    const [formData, setFormData] = useState({
        searchQuery: '',     // chef name, cuisine, or dish
        searchType: 'chef',  // 'chef', 'cuisine', or 'dish'
        radius: 10,    // search radius in miles (default 10)
        gender: 'all',       // 'any', 'male', 'female'
        timing: 'all',       // 'any', 'breakfast', 'lunch', 'dinner'
        locationAddress: '',
        latitude: null,
        longitude: null,
        min_rating: 0,
        max_price: 500,
        sort_by: 'distance',
        limit: 20,
        offset: 0,
    });

    const { apiUrl } = getEnvVars();
    const { token, userId, profileId } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSearchResults = async () => {
        setLoading(true);
        setError(null);

        try {
            const searchParams = new URLSearchParams();

            const apiParams = [
                'latitude', 'longitude', 'radius', 'min_rating',
                'max_price', 'sort_by', 'limit', 'offset'
            ];

            const otherFutureParams = [
                'searchQuery', 'searchType', 'gender', 'timing'
            ];

            const allRelevantParams = [...apiParams, ...otherFutureParams];

            for (const key of allRelevantParams) {
                const value = formData[key];

                if (value !== null && value !== '' && value !== undefined) {
                    if (key === 'min_rating' && value === 0) continue;
                    if (key === 'radius' && value === 10) continue;
                    if (key === 'limit' && value === 20) continue;
                    if (key === 'offset' && value === 0) continue;
                    if (key === 'sort_by' && value === 'distance') continue;
                    if ((key === 'gender' || key === 'timing' || key === 'searchType') && value === 'all') continue;

                    searchParams.append(key, value);
                }
            }

            if (!formData.latitude || !formData.longitude) {
                throw new Error('Location is required for search.');
            }

            const url = `${apiUrl}/search/chefs/nearby?${searchParams.toString()}`;

            console.log("SEARCHING");

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log("RESPONSE ", JSON.stringify(response))
            const data = await response.json();
            console.log("data ", JSON.stringify(data));

            if (response.ok) {
                alert("OK" + JSON.stringify(data));
            } else {
                setError(data.error || 'Failed to load results.');
                alert('Error' + (data.error || 'Failed to load results.'));
            }

        } catch (err) {
            setError(err.message || 'Network error. Could not connect to API.');

            alert('Error: ' + (err.message || 'Network error. Could not connect to API.'));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        console.log("Initiating search with data:", formData);
        fetchSearchResults();
    };

    return (
        <ScrollView className="flex-1 bg-base-100 p-5 gap-y-12 pt-24">

            <SearchBarComponent
                formData={formData}
                setFormData={setFormData}
                handleSearch={handleSearch}
            />

            <Card
                title="Favorite Chefs"
                headerIcon="heart"
                isCollapsible={true}
                isScrollable={true}
                scrollDirection="horizontal"
            >
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">Jane Doe</Text>
                    <Text className="text-base text-olive-500 text-center">Italian</Text>
                </View>
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">John Smith</Text>
                    <Text className="text-base text-olive-500 text-center">French</Text>
                </View>
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">George Johnson</Text>
                    <Text className="text-base text-olive-500 text-center">Vietnamese</Text>
                </View>
            </Card>
            <Card
                title="Recent Chefs"
                headerIcon="history"
                isCollapsible={true}
                isScrollable={true}
                scrollDirection="horizontal"
            >
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">Jane Doe</Text>
                    <Text className="text-base text-olive-500 text-center">Italian</Text>
                </View>
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">John Smith</Text>
                    <Text className="text-base text-olive-500 text-center">French</Text>
                </View>
                <View className="gap-y-3 px-4 bg-base-100 shadow-sm shadow-olive-300">
                    <Text className="text-base text-olive-500 text-center">George Johnson</Text>
                    <Text className="text-base text-olive-500 text-center">Vietnamese</Text>
                </View>
            </Card>
            <Card
                title="Nearby Chefs"
                headerIcon="location"
                isScrollable={true}
                scrollDirection="vertical"
            >
                {SEARCH_RESULTS.map((result, index) =>
                    <SearchResultCard
                        key={index}
                        chef_id={result["chef_id"]}
                        distance={result["distance"]}
                        cuisine={result["cuisine"]}
                        timing={result["timing"]}
                        rating={result["rating"]}
                    />)}
            </Card>
            <View className="h-24" />
        </ScrollView>
    );

}