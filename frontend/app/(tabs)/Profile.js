import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import getEnvVars from "../../config";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export default function ProfileScreen() {
    const { logout, token, userType, userId } = useAuth();
    const { apiUrl } = getEnvVars();
    const navigation = useNavigation();

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /*useEffect(() => {
        const fetchProfile = async () => {
            if (!userId || !token || !userType) return;

            setLoading(true);
            setError(null);

            try {
                const url = `${apiUrl}/profile/${userType}/${userId}`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    setProfileData(data.profile);
                } else {
                    setError(data.error || 'Failed to load profile.');
                    Alert.alert('Error', data.error || 'Failed to load profile.');
                }
            } catch (err) {
                setError('Network error. Could not connect to API.');
                Alert.alert('Error', 'Network error. Could not connect to API.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId, userType, token, apiUrl]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-base-100">
                <Text className="text-lg text-olive-500">Loading Profile...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-base-100">
                <Text className="text-lg text-red-500">Error: {error}</Text>
                <Button
                    title="Retry"
                    variant="primary"
                    onPress={() => setUserId(userId)} 
                    customClasses="mt-5 w-1/2"
                />
            </View>
        );
    }*/

    return (
        <View className="flex-1 bg-base-100">
            {/* Profile Settings Button in top-right corner */}
            <TouchableOpacity
                style={{
                    position: "absolute",
                    top: 40,
                    right: 20,
                    zIndex: 10,
                    backgroundColor: "#d9f99d",
                    padding: 8,
                    borderRadius: 20,
                }}
                onPress={() => navigation.navigate("ProfileSettings")}
            >
                <Text className="text-olive-500 font-bold">⚙️</Text>
            </TouchableOpacity>
            <ScrollView className="p-5">
                <Text className="text-base text-warm-gray text-center mt-12"> Profile Picture </Text>
                <Text className="text-base text-warm-gray text-center mt-12"> {profileData?.first_name} {profileData?.last_name} </Text>
                <Text className="text-base text-warm-gray text-center mt-12"> Description </Text>
                <Button
                    title="Log out"
                    style="primary"
                    onPress={logout}
                />
            </ScrollView>
        </View>
    );

}