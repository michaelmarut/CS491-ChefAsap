import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import Octicons from '@expo/vector-icons/Octicons';
import Button from './Button';
import Input from './Input';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_STORAGE_KEY = 'last-used-location';

export default function LocationInput({
    onLocationSelect, // callback (lat, lon, addressString) => void.
    formData, // parent form state object
    setFormData // parent form state setter
}) {
    const [addressInput, setAddressInput] = useState(formData.locationAddress || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const [lastUsedLocation, setLastUsedLocation] = useState(null);

    useEffect(() => {
        const loadLocation = async () => {
            const storedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
            if (storedLocation) {
                setLastUsedLocation(storedLocation);
                setAddressInput(storedLocation);
                geocodeAddress(storedLocation);
            } else {
                getCurrentLocation();
            }
        };
        loadLocation();
    }, []);

    useEffect(() => {
        if (formData.locationAddress) {
            setAddressInput(formData.locationAddress);
        }
    }, [formData.locationAddress]);

    const updateSavedLocation = async (newLocation) => {
        setLastUsedLocation(newLocation);
        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, newLocation);
    };

    const getCurrentLocation = async () => {
        setLoading(true);
        setError(null);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is required to use GPS.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 10000,
                maximumAge: 10000
            });
            const { latitude, longitude } = location.coords;

            let reverseGeo = await Location.reverseGeocodeAsync({
                latitude,
                longitude
            });

            const primaryAddress = reverseGeo[0];

            const addressString = `${primaryAddress.name} ${primaryAddress.street}, ${primaryAddress.city}, ${primaryAddress.region} ${primaryAddress.postalCode}`;

            setAddressInput(addressString);
            onLocationSelect(latitude, longitude, addressString);
            setSelection({ start: 0, end: 0 });

            geocodeAddress(addressString);


        } catch (err) {
            console.error("GPS Error:", err);
            setError("Could not get current location.");
            Alert.alert('GPS Error', "Failed to retrieve your current location.");
        } finally {
            setLoading(false);
        }
    };

    const geocodeAddress = async (addressToGeocode) => {
        const address = typeof addressToGeocode === 'string' ? addressToGeocode : addressInput;
        //console.log("Geocoding address:", address);
        if (address.trim() === '') {
            setError("Please enter a valid address.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let geocodeResult = await Location.geocodeAsync(address);

            if (geocodeResult.length === 0) {
                setError("Address not found. Please be more specific.");
                Alert.alert('Address Error', "We couldn't find a location for that address.");
                return;
            }

            const { latitude, longitude } = geocodeResult[0];
            onLocationSelect(latitude, longitude, address);
            updateSavedLocation(address);

            setAddressInput(address);
            setSelection({ start: 0, end: 0 });
            
            //Alert.alert('Location Saved', `Location saved for coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

        } catch (err) {
            console.error("Geocoding Error:", err);
            setError("Geocoding service failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="p-4 pt-2 pb-2 bg-primary-100 rounded-xl shadow-md flex-row w-full items-center justify-center shadow-sm shadow-primary-500 dark:bg-dark-100">
            <Button
                icon={loading ? "sync" : "location"}
                onPress={getCurrentLocation}
                disabled={loading}
                customClasses='rounded-lg w-12 h-12 m-1'
                style='accent'
            />
            <Input
                placeholder="Street, City, State, Zip"
                value={addressInput}
                onChangeText={setAddressInput}
                //error={error}
                containerClasses='w-[88%]'
                onBlur={geocodeAddress}
                selection={selection}
                onSelectionChange={({ nativeEvent: { selection } }) => setSelection(selection)}
            />
        </View>
    );
}