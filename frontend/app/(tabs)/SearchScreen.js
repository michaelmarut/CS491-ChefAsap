import { useState } from 'react';
import { ScrollView, Text, View } from "react-native";
import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import Card from "../components/Card";
import Button from '../components/Button';
import LoadingIcon from "../components/LoadingIcon";
import SearchBarComponent from '../components/SearchBar';
import SearchResultCard from '../components/SearchResultCard';
import ProfilePicture from '../components/ProfilePicture';

const SEARCH_RESULTS = [
    { chef_id: 5, distance: 1.1, cuisine: ["Italian"], timing: ["Lunch"], rating: 5 },
    { chef_id: 6, distance: 1.7, cuisine: ["French", "Italian"], timing: ["Lunch", "Dinner"], rating: 3 },
    { chef_id: 7, distance: 2.2, cuisine: ["Italian", "Vietnamese"], timing: ["Lunch", "Dinner"], rating: 4 },
];

const tempChefCard = (
    <View className="flex bg-olive-100 shadow-sm shadow-olive-300 mr-4 rounded-xl border-2 border-olive-400">
        <View className="w-full p-2">
            <ProfilePicture size={24} firstName='John' lastName='Doe' />
        </View>
        <View className="flex-row bg-olive-300 rounded-b-lg w-full p-2 pb-0 items-center ">
            <View>
                <Text className="text-sm text-olive-100 text-center">Jane Doe</Text>
                <Text className="text-sm text-olive-100 text-center">Italian</Text>
            </View>
            <Button
                icon="link-external"
                style="primary"
                base="link"
                customClasses='ml-3 p-0'
                href={'/ChefProfileScreen/1'}
            />
        </View>
    </View>
);

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
    const [searchResults, setSearchResults] = useState([]);

    const fetchSearchResults = async () => {
        setLoading(true);
        setError(null);

        try {
            const searchParams = new URLSearchParams();

            const apiParams = [
                'latitude', 'longitude', 'radius', 'min_rating', 'gender',
                'max_price', 'sort_by', 'limit', 'offset'
            ];

            const otherFutureParams = [
                'searchQuery', 'searchType', 'gender', 'timing', 'cuisine'
            ];

            const allRelevantParams = [...apiParams, ...otherFutureParams];

            for (const key of allRelevantParams) {
                const value = formData[key];

                if (value !== null && value !== '' && value !== undefined) {

                    searchParams.append(key, value);
                }
            }

            if (!formData.latitude || !formData.longitude) {
                setError('Location is required for search. Please enable GPS or enter an address manually.');
                alert('Location Required: Please enable GPS or enter an address manually to search for nearby chefs.');
                setLoading(false);
                return;
            }

            const url = `${apiUrl}/search/chefs/nearby?${searchParams.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setSearchResults(data.chefs || []);
                setError(null);
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
        fetchSearchResults();
    };

    return (
        <ScrollView className="flex-1 bg-base-100 p-5 pt-12">
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
                {tempChefCard}
                {tempChefCard}
                {tempChefCard}
            </Card>
            <Card
                title="Recent Chefs"
                headerIcon="history"
                isCollapsible={true}
                isScrollable={true}
                scrollDirection="horizontal"
            >
                {tempChefCard}
                {tempChefCard}
                {tempChefCard}
            </Card>
            <Card
                title="Nearby Chefs"
                headerIcon="location"
                isScrollable={true}
                scrollDirection="vertical"
            >
                {searchResults.map((result, index) =>
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