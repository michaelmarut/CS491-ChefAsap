import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import Octicons from '@expo/vector-icons/Octicons';
import Button from './Button';
import Input from './Input';

export default function LocationInput({
    onLocationSelect, // callback (lat, lon, addressString) => void.
    formData, // parent form state object
    setFormData // parent form state setter
}) {
    const [addressInput, setAddressInput] = useState(formData.locationAddress || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getCurrentLocation = async () => {
        setLoading(true);
        setError(null);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is required to use GPS.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            let reverseGeo = await Location.reverseGeocodeAsync({
                latitude,
                longitude
            });

            const primaryAddress = reverseGeo[0];

            const streetAddress = primaryAddress.name || primaryAddress.street || '';

            const addressString = `${primaryAddress.name} ${primaryAddress.street}, ${primaryAddress.city}, ${primaryAddress.region} ${primaryAddress.postalCode}`;

            setAddressInput(addressString);
            onLocationSelect(latitude, longitude, addressString);

        } catch (err) {
            console.error("GPS Error:", err);
            setError("Could not get current location.");
            Alert.alert('GPS Error', "Failed to retrieve your current location.");
        } finally {
            setLoading(false);
        }
    };

    const geocodeAddress = async () => {
        if (addressInput.trim() === '') {
            setError("Please enter a valid address.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let geocodeResult = await Location.geocodeAsync(addressInput);

            if (geocodeResult.length === 0) {
                setError("Address not found. Please be more specific.");
                Alert.alert('Address Error', "We couldn't find a location for that address.");
                return;
            }

            const { latitude, longitude } = geocodeResult[0];
            onLocationSelect(latitude, longitude, addressInput);
            Alert.alert('Location Saved', `Location saved for coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

        } catch (err) {
            console.error("Geocoding Error:", err);
            setError("Geocoding service failed.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (formData.locationAddress) {
            setAddressInput(formData.locationAddress);
        }
    }, [formData.locationAddress]);

    return (
        <View className="p-4 bg-white rounded-xl shadow-md flex-row w-full items-center justify-center">
            <Button
                icon={loading ? "sync" : "location"}
                onPress={getCurrentLocation}
                disabled={loading}
                customClasses='rounded-lg w-14 h-14 mr-3'
            />

            <Input
                placeholder="Street, City, State, Zip"
                value={addressInput}
                onChangeText={setAddressInput}
                error={error}
            />

            <Button
                icon="check-circle"
                onPress={geocodeAddress}
                disabled={loading}
                customClasses='rounded-lg w-14 h-14 ml-3'
            />
        </View>
    );
}