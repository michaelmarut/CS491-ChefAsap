import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, RefreshControl } from "react-native";
import { Link } from 'expo-router';
import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import Card from "../components/Card";
import Button from '../components/Button';
import LoadingIcon from "../components/LoadingIcon";
import SearchBarComponent from '../components/SearchBar';
import SearchResultCard from '../components/SearchResultCard';
import ProfilePicture from '../components/ProfilePicture';
import RatingsDisplay from '../components/RatingsDisplay';

const tempChefCard = (
    <View className="flex bg-primary-100 shadow-sm shadow-primary-300 mr-4 rounded-xl border-2 border-primary-400 dark:bg-dark-100 dark:shadow-dark-300 dark:border-dark-400">
        <View className="w-full p-2">
            <ProfilePicture size={24} firstName='John' lastName='Doe' />
        </View>
        <View className="flex-row bg-primary-300 rounded-b-lg w-full p-2 pb-0 items-center dark:bg-dark-300">
            <View>
                <Text className="text-sm text-primary-100 text-center dark:text-dark-100">Jane Doe</Text>
                <Text className="text-sm text-primary-100 text-center dark:text-dark-100">Italian</Text>
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
    const [recentSearches, setRecentSearches] = useState([]);
    const [recentChefs, setRecentChefs] = useState([]);
    const [favoriteChefs, setFavoriteChefs] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [autoLoadCompleted, setAutoLoadCompleted] = useState(false);
    const [loadingFaves, setLoadingFaves] = useState(false);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [refreshing, setRefreshing] = useState(null);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRecentSearches();
        fetchRecentChefs();
        fetchFavoriteChefs();
        fetchSearchResults();
    };

    useEffect(() => {
        if (refreshing) setRefreshing(loading || loadingFaves || loadingRecent);
    }, [loading, loadingFaves, loadingRecent])

    // Auto-load nearby chefs when location is available
    useEffect(() => {
        if (formData.latitude && formData.longitude && token) {
            fetchSearchResults();
            setAutoLoadCompleted(true);
        }
    }, [formData.latitude, formData.longitude, token]);

    // Fetch recent searches when component loads
    useEffect(() => {
        if (token && profileId) {
            fetchRecentSearches();
            fetchRecentChefs();
            fetchFavoriteChefs();
        }
    }, [token, profileId]);

    const handleSearch = () => {
        fetchSearchResults();
    };

    // Fetch recent searches for the customer (search keywords)
    const fetchRecentSearches = async () => {
        if (!profileId) return;

        try {
            const url = `${apiUrl}/search/recent/${profileId}?limit=5`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setRecentSearches(data.recent_searches || []);
            }
        } catch (err) {
            console.error('Failed to fetch recent searches:', err);
        }
    };

    // Fetch recently booked chefs (based on completed bookings)
    const fetchRecentChefs = async () => {
        //console.log('[SearchScreen] fetchRecentChefs called, profileId:', profileId);
        if (!profileId) {
            //console.log('[SearchScreen] No profileId, skipping fetch');
            return;
        }

        try {
            setLoadingRecent(true);
            const url = `${apiUrl}/search/viewed-chefs/${profileId}?limit=5`;
            //console.log('[SearchScreen] Fetching recent chefs from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            //console.log('[SearchScreen] Recent chefs response:', data);

            if (response.ok && data.success) {
                //console.log('[SearchScreen] Setting recent chefs:', data.viewed_chefs?.length || 0, 'chefs');
                setRecentChefs(data.viewed_chefs || []);
            } else {
                console.log('[SearchScreen] Response not ok or not success:', response.ok, data.success);
            }
        } catch (err) {
            console.error('[SearchScreen] Failed to fetch recent chefs:', err);
        } finally {
            setLoadingRecent(false);
        }
    };

    const fetchFavoriteChefs = async () => {
        if (!profileId) {
            return;
        }
        try {
            setLoadingFaves(true);
            const url = `${apiUrl}/booking/customer/${profileId}/favorite-chefs`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            //console.log('[SearchScreen] favorite chefs response:', data);

            if (response.ok && data.success) {
                setFavoriteChefs(data.favorite_chefs || []);
            } else {
                console.log('[SearchScreen] Response not ok or not success:', response.ok, data.success);
            }
        } catch (err) {
            console.error('[SearchScreen] Failed to fetch favorite chefs:', err);
        } finally {
            setLoadingFaves(false);
        }
    };

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

            // Add customer_id to save search history
            if (profileId) {
                searchParams.append('customer_id', profileId);
            }

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
                // Transform backend data to match SearchResultCard format
                const transformedResults = (data.chefs || []).map(chef => ({
                    chef_id: chef.chef_id,
                    first_name: chef.first_name,
                    last_name: chef.last_name,
                    distance: chef.distance_miles,
                    cuisine: chef.cuisines || [],
                    timing: chef.meal_timings || [],
                    rating: Math.round(chef.rating?.average_rating || 0)
                }));
                setSearchResults(transformedResults);
                setError(null);

                // Refresh recent searches after a successful search
                fetchRecentSearches();
                setRefreshKey(prev => prev + 1);
            } else {
                setError(data.error || 'Failed to load results.');
                alert('Error' + (data.error || 'Failed to load results.'));
            }

        } catch (err) {
            setError(err.message || 'Network error. Could not connect to API.');

            alert('Error: ' + (err.message || 'Network error. Could not connect to API.'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Auto-load nearby chefs when location is available
    useEffect(() => {
        if (formData.latitude && formData.longitude && token) {
            fetchSearchResults();
        }
    }, [formData.latitude, formData.longitude, token]);

    // Render recently booked chef card
    const renderSmallCard = (chef) => (
        <Link key={chef.chef_id} href={`/ChefProfileScreen/${chef.chef_id}`} asChild>
            <TouchableOpacity className="flex shadow-sm mr-4 rounded-xl border-2 bg-base-100 dark:bg-base-dark-100 border-primary-100 dark:border-dark-100 shadow-primary-400 dark:shadow-dark-400">
                <View className="w-full p-2">
                    <ProfilePicture size={24} photoUrl={chef.photo_url} firstName={chef.first_name} lastName={chef.last_name} />
                </View>
                <View className="bg-primary-100 dark:bg-dark-100 rounded-b-lg w-full p-2 items-center">
                    <Text className="text-sm text-primary-400 dark:text-dark-400 text-center font-semibold">
                        {chef.full_name}
                    </Text>
                    <Text className="text-xs text-primary-400 dark:text-dark-400 text-center">
                        {chef.cuisines && chef.cuisines.length > 0 ? chef.cuisines.slice(0, 2).join(', ') : 'Chef'}
                    </Text>
                    <RatingsDisplay rating={chef.rating && chef.rating.average_rating ? chef.rating.average_rating : 0} />
                </View>
            </TouchableOpacity>
        </Link>
    );

    // Function to re-run a recent search
    const handleRecentSearchClick = (search) => {
        setFormData({
            ...formData,
            searchQuery: search.search_query || '',
            cuisine: search.cuisine || '',
            gender: search.gender || 'all',
            timing: search.meal_timing || 'all',
            min_rating: search.min_rating || 0,
            max_price: search.max_price || 500,
            radius: search.radius || 10,
            latitude: search.latitude || formData.latitude,
            longitude: search.longitude || formData.longitude,
        });
        // Trigger search with these parameters
        setTimeout(() => fetchSearchResults(), 100);
    };

    return (
        <ScrollView
            className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <SearchBarComponent
                key={refreshKey}
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
                {loadingFaves ? <LoadingIcon message='' size={64} icon='spinner'/> : favoriteChefs.length > 0 ? (
                    favoriteChefs.map((chef) => renderSmallCard(chef))
                ) : (
                    <View className="p-4">
                        <Text className="text-primary-700 dark:text-dark-700 text-center">
                            Favorited chefs will appear here.
                        </Text>
                    </View>
                )}
            </Card>
            <Card
                title="Recent Chefs"
                headerIcon="history"
                isCollapsible={true}
                isScrollable={true}
                scrollDirection="horizontal"
            >
                {loadingRecent ? <LoadingIcon message='' size={64} icon='spinner'/> : recentChefs.length > 0 ? (
                    recentChefs.map((chef) => renderSmallCard(chef))
                ) : (
                    <View className="p-4">
                        <Text className="text-primary-700 dark:text-dark-700 text-center">
                            Recently ordered from chefs will appear here.
                        </Text>
                    </View>
                )}
            </Card>
            <Card
                title="Nearby Chefs"
                headerIcon="location"
                isScrollable={true}
                scrollDirection="vertical"
            >
                {searchResults.length != 0 ? searchResults.map((result, index) =>
                    <SearchResultCard
                        key={index}
                        chef_id={result["chef_id"]}
                        first_name={result["first_name"]}
                        last_name={result["last_name"]}
                        distance={result["distance"]}
                        cuisine={result["cuisine"]}
                        timing={result["timing"]}
                        rating={result["rating"]}
                    />)
                    :
                    <LoadingIcon icon='food' size={64} message='Fetching Nearby Chefs...' />
                }
            </Card>
            <View className="h-8" />
        </ScrollView>
    );

}