import { useEffect, useState } from "react";
import { ScrollView, Text, View, Alert } from "react-native";

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import LoadingIcon from "../components/LoadingIcon";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import Card from "../components/Card";

export default function ProfileScreen() {
    const { logout, token, userType, userId, profileId } = useAuth();
    const { apiUrl } = getEnvVars();

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
                    title="Log out"
                    style="primary"
                    onPress={logout}
                />
            </View>
        );
    }


    return (
        <ScrollView className="flex-1 bg-base-100 p-5 pt-12">
            <Card
                title="Profile"
                headerIcon="person"
            >
                {/* Display profile picture */}
                <ProfilePicture photoUrl={profileData.photo_url} firstName={profileData?.first_name} lastName={profileData?.last_name} />
                <Text className="text-xl font-bold text-wrap mb-1 mt-2 text-olive-400">{profileData?.first_name} {profileData?.last_name} </Text>
                <Text className="text-lg text-wrap text-olive-400">{userType}</Text>
                <Text className="text-lg text-wrap text-olive-400">Joined: {profileData.member_since} </Text>

                {/* Profile Settings Button in top-right corner */}
                <Button
                    href="/ProfileSettings"
                    icon="gear"
                    style="accent"
                    customClasses="absolute -top-[70px] -right-2 z-10 p-3 rounded-full pl-3"
                />
            </Card>

            {userType === "customer" ? (
                <>
                    <Card
                        title="Help & Policies"
                        headerIcon="info"
                    >
                        <Text className="text-lg text-wrap mb-1 mt-2 text-olive-400"> Help</Text>
                        <Text className="text-lg text-wrap mb-1 mt-2 text-olive-400"> Policies</Text>

                    </Card>
                </>
            ) : (
                <>
                    <Card
                        title="Most Ordered"
                        headerIcon="heart"
                    >
                        {/* Placeholder most ordered meals from chef*/}
                        <Text className="text-lg text-wrap mb-1 mt-2 text-olive-400">1. Curry Chicken</Text>
                        <Text className="text-lg text-wrap mb-1 mt-2 text-olive-400">2. Jerk Chicken</Text>
                        <Text className="text-lg text-wrap mb-1 mt-2 text-olive-400">3. Fried Chicken</Text>

                    </Card>

                    <Card
                        title="Meal Options"
                        headerIcon="flame"
                    >
                        {/* Example meal options; replace with dynamic data as needed */}
                        <Text className="text-lg text-wrap mb-1 mt-2 text-olive-400">* Curry Chicken</Text>
                        <Text className="text-lg text-wrap mb-1 mt-2 text-olive-400">* Jerk Chicken</Text>
                        <Text className="text-lg text-wrap mb-1 mt-2 text-olive-400">* Fried Chicken</Text>
                        <Text className="text-lg text-wrap mb-1 mt-2 text-olive-400">* Oxtail</Text>

                    </Card>
                </>
            )}
            
            <Button
                title="Log out"
                style="primary"
                onPress={logout}
            />

            <View className="h-24" />
        </ScrollView>
    );
}