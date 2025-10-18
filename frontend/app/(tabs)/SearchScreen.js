import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Card from "../components/Card";
import Button from '../components/Button';
import LoadingIcon from "../components/LoadingIcon";
import LocationInput from '../components/LocationInput';
import SearchBarComponent from '../components/SearchBar';
import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

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
            // 1. Filter out parameters not intended for the backend query string
            //    (e.g., locationAddress, formData keys that aren't API parameters)
            //    AND filter out null/empty/default values to keep the URL clean.
            const searchParams = new URLSearchParams();

            // Parameters expected by the backend (based on your API snippet)
            const apiParams = [
                'latitude', 'longitude', 'radius', 'min_rating',
                'max_price', 'sort_by', 'limit', 'offset'
            ];

            // Add additional, future-used parameters to this check:
            // 'searchQuery', 'searchType', 'gender', 'timing' 
            const otherFutureParams = [
                'searchQuery', 'searchType', 'gender', 'timing'
            ];

            const allRelevantParams = [...apiParams, ...otherFutureParams];

            for (const key of allRelevantParams) {
                const value = formData[key];

                // Only include non-null values and non-empty strings
                if (value !== null && value !== '' && value !== undefined) {
                    // Special check for default values to keep the URL clean (optional but good practice)
                    if (key === 'min_rating' && value === 0) continue;
                    if (key === 'radius' && value === 10) continue;
                    if (key === 'limit' && value === 20) continue;
                    if (key === 'offset' && value === 0) continue;
                    if (key === 'sort_by' && value === 'distance') continue;
                    if ((key === 'gender' || key === 'timing' || key === 'searchType') && value === 'all') continue;


                    searchParams.append(key, value);
                }
            }

            // Ensure latitude and longitude are present for the backend requirement
            if (!formData.latitude || !formData.longitude) {
                // Throw an error early if required parameters are missing
                throw new Error('Location is required for search.');
            }

            // 2. Build the final URL with the constructed query string
            const url = `${apiUrl}/search/chefs/nearby?${searchParams.toString()}`;

            console.log("SEARCHING");

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                // The body property is correctly OMITTED for GET
            });

            console.log("RESPONSE ", JSON.stringify(response))
            const data = await response.json();
            console.log("data ", JSON.stringify(data));
            if (response.ok) {
                alert("OK"+JSON.stringify(data));
            } else {
                setError(data.error || 'Failed to load results.');
                alert('Error' + (data.error || 'Failed to load results.'));
                console.log("data ", JSON.stringify(data));
            }

        } catch (err) {
            // This catch block will now handle:
            // 1. The custom "Location is required" error.
            // 2. Network errors (if any, though less likely now).
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
                <Card
                    title="Jane Doe"
                    footerButtonProps={{ title: "Book", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-olive-500 text-center">Italian</Text>
                        <Text className="text-base text-olive-500 text-center">Breakfast, Lunch, Dinner</Text>
                        <Text className="text-base text-olive-500 text-center">3 miles away</Text>
                    </View>
                </Card>
                <Card
                    title="John Smith"
                    footerButtonProps={{ title: "Book", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-olive-500 text-center">French</Text>
                        <Text className="text-base text-olive-500 text-center">Breakfast</Text>
                        <Text className="text-base text-olive-500 text-center">5 miles away</Text>
                    </View>
                </Card>
                <Card
                    title="George Johnson"
                    footerButtonProps={{ title: "Book", style: "secondary", onPress: () => alert("Info Placeholder") }}
                >
                    <View className="gap-y-3">
                        <Text className="text-base text-olive-500 text-center">Vietnamese</Text>
                        <Text className="text-base text-olive-500 text-center">Lunch, Dinner</Text>
                        <Text className="text-base text-olive-500 text-center">7 miles away</Text>
                    </View>
                </Card>
            </Card>
            <View className="h-24" />
        </ScrollView>
    );

}