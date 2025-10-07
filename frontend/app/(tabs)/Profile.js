import { ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import getEnvVars from "../../config";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import LoadingIcon from "../components/LoadingIcon";
import ProfilePicture from "../components/ProfilePicture";

export default function ProfileScreen() {
    const { logout, token, userType, userId, profileId } = useAuth();
    const { apiUrl } = getEnvVars();
    const navigation = useNavigation();

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId || !token || !userType || !profileId) return;

            setLoading(true);
            setError(null);

            try {
                const url = `${apiUrl}/profile/${userType}/${profileId}`;

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
                    // Log the source of the profile picture
                    console.log("Profile picture source:", `${apiUrl}${data.profile?.photo_url}`);
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
    }, [profileId, userId, userType, token, apiUrl]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-base-100">
                <LoadingIcon />
                <Button
                    title="Log out"
                    style="primary"
                    onPress={logout}
                />
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
    }

    return (
        <View className="flex-1 bg-base-100">
            {/* Profile Settings Button in top-right corner */}
            <Button
                title=""
                href="/ProfileSettings"
                icon="gear"
                customClasses="absolute top-10 right-5 z-10 p-3 rounded-full pl-5 pl-5"
            />

            <ScrollView className="p-5 mt-8">
                {/* Display profile picture */}
                <ProfilePicture photoUrl={profileData.photo_url} firstName={profileData?.first_name} lastName={profileData?.last_name} />
                <Text className="text-base text-warm-gray text-center mt-4"> Profile Picture </Text>
                <Text className="text-base text-warm-gray text-center mt-12"> {profileData?.first_name} {profileData?.last_name} </Text>
                <Text className="text-base text-warm-gray text-center mt-12"> Description </Text>
                <Button
                    title="Log out"
                    style="primary"
                    onPress={logout}
                />
                <View className="h-24" />
            </ScrollView>
        </View>
    );

}