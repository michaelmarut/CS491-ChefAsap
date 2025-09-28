import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import getEnvVars from '../config';

const ChefSearchScreen = () => {
  const { apiUrl } = getEnvVars();
  const API_BASE = `${apiUrl}/api/bookings`;

  // State for filters
  const [filters, setFilters] = useState({
    cuisineType: '',
    gender: '',
    city: '',
    state: '',
    minRating: '',
    maxDistance: '',
    availabilityDate: '',
    sortBy: 'rating',
  });

  // State for results and UI
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    cuisine_types: [],
    cities: [],
    states: [],
    genders: ['male', 'female', 'nonbinary', 'prefer_not_say'],
  });
  const [totalFound, setTotalFound] = useState(0);

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
    searchChefs(); // Load initial results
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Create manual AbortController for React Native compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE}/filter-options`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (response.ok) {
        const options = await response.json();
        setFilterOptions(options);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
      // Silently fail for filter options - app can still work without them
    }
  };

  const searchChefs = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          // Convert camelCase to snake_case for API
          const apiKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          params.append(apiKey, value);
        }
      });

      // Create manual AbortController for React Native compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE}/search-chefs?${params}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setChefs(data.chefs || []);
        setTotalFound(data.total_found || 0);
      } else {
        Alert.alert('Error', 'Failed to search chefs. Please try again.');
      }
    } catch (error) {
      console.error('Search error:', error);
      
      let errorMessage = 'Unable to connect to server. Please check your connection.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('Premature close')) {
        errorMessage = 'Connection closed unexpectedly. Please try again.';
      }
      
      Alert.alert('Connection Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      cuisineType: '',
      gender: '',
      city: '',
      state: '',
      minRating: '',
      maxDistance: '',
      availabilityDate: '',
      sortBy: 'rating',
    });
  };

  const handleBookChef = (chef) => {
    Alert.alert(
      'Book Chef',
      `Would you like to book ${chef.first_name} ${chef.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Book Now', 
          onPress: () => {
            // TODO: Navigate to booking page or implement booking logic
            Alert.alert('Success', `Booking request sent to ${chef.first_name}!`);
          }
        }
      ]
    );
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.round(rating));
  };

  const renderChefCard = (chef) => (
    <View key={chef.chef_id} style={styles.chefCard}>
      <View style={styles.chefHeader}>
        <View style={styles.chefAvatar}>
          <Text style={styles.avatarText}>
            {chef.first_name.charAt(0)}{chef.last_name.charAt(0)}
          </Text>
        </View>
        <View style={styles.chefInfo}>
          <Text style={styles.chefName}>
            {chef.first_name} {chef.last_name}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.stars}>{renderStars(chef.average_rating)}</Text>
            <Text style={styles.ratingText}>
              {chef.average_rating.toFixed(1)} ({chef.total_reviews} reviews)
            </Text>
          </View>
        </View>
      </View>

      {(chef.city || chef.residency) && (
        <Text style={styles.location}>
          📍 {[chef.city, chef.residency].filter(x => x).join(', ')}
        </Text>
      )}

      {chef.distance_miles && (
        <Text style={styles.distance}>
          🚗 {chef.distance_miles} miles away
        </Text>
      )}

      {chef.cuisines && chef.cuisines.length > 0 && (
        <View style={styles.cuisinesContainer}>
          {chef.cuisines.map((cuisine, index) => (
            <Text key={index} style={styles.cuisineTag}>
              {cuisine}
            </Text>
          ))}
        </View>
      )}

      {chef.bio && (
        <Text style={styles.bio} numberOfLines={3}>
          {chef.bio}
        </Text>
      )}

      <TouchableOpacity 
        style={styles.bookButton}
        onPress={() => handleBookChef(chef)}
      >
        <Text style={styles.bookButtonText}>📅 Book Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>🍳 Find Your Perfect Chef</Text>
          <Text style={styles.subtitle}>Discover amazing chefs with advanced search</Text>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Search Filters</Text>
          
          {/* Cuisine Type */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Cuisine Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.cuisineType}
                onValueChange={(value) => updateFilter('cuisineType', value)}
                style={styles.picker}
              >
                <Picker.Item label="All Cuisines" value="" />
                {filterOptions.cuisine_types.map((cuisine) => (
                  <Picker.Item key={cuisine} label={cuisine} value={cuisine} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Gender */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Chef Gender</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.gender}
                onValueChange={(value) => updateFilter('gender', value)}
                style={styles.picker}
              >
                <Picker.Item label="Any Gender" value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Non-binary" value="nonbinary" />
                <Picker.Item label="Prefer not to say" value="prefer_not_say" />
              </Picker>
            </View>
          </View>

          {/* City */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>City</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.city}
                onValueChange={(value) => updateFilter('city', value)}
                style={styles.picker}
              >
                <Picker.Item label="All Cities" value="" />
                {filterOptions.cities.map((city) => (
                  <Picker.Item key={city} label={city} value={city} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Min Rating */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Minimum Rating</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.minRating}
                onValueChange={(value) => updateFilter('minRating', value)}
                style={styles.picker}
              >
                <Picker.Item label="Any Rating" value="" />
                <Picker.Item label="3.0+ ⭐⭐⭐" value="3.0" />
                <Picker.Item label="3.5+ ⭐⭐⭐⭐" value="3.5" />
                <Picker.Item label="4.0+ ⭐⭐⭐⭐" value="4.0" />
                <Picker.Item label="4.5+ ⭐⭐⭐⭐⭐" value="4.5" />
              </Picker>
            </View>
          </View>

          {/* Sort By */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.sortBy}
                onValueChange={(value) => updateFilter('sortBy', value)}
                style={styles.picker}
              >
                <Picker.Item label="Rating (Best First)" value="rating" />
                <Picker.Item label="Distance (Closest First)" value="distance" />
                <Picker.Item label="Name (A-Z)" value="name" />
                <Picker.Item label="City (A-Z)" value="city" />
              </Picker>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.searchButton} onPress={searchChefs}>
              <Text style={styles.searchButtonText}>🔍 Search Chefs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>🗑️ Clear Filters</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Searching for chefs...</Text>
          </View>
        ) : (
          <>
            {totalFound > 0 && (
              <View style={styles.resultsInfo}>
                <Text style={styles.resultsText}>
                  Found {totalFound} chef{totalFound !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            <View style={styles.chefsContainer}>
              {chefs.length > 0 ? (
                chefs.map(renderChefCard)
              ) : (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsTitle}>No chefs found</Text>
                  <Text style={styles.noResultsText}>
                    Try adjusting your filters to see more results
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  filterGroup: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  searchButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  clearButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  resultsInfo: {
    backgroundColor: '#e3f2fd',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  chefsContainer: {
    padding: 10,
  },
  chefCard: {
    backgroundColor: 'white',
    marginBottom: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  chefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  chefAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chefInfo: {
    flex: 1,
  },
  chefName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    fontSize: 16,
    marginRight: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  distance: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 10,
  },
  cuisinesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  cuisineTag: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 15,
    fontSize: 12,
    marginRight: 5,
    marginBottom: 5,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  bookButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ChefSearchScreen;