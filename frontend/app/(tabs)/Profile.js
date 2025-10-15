import { ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import getEnvVars from "../../config";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import LoadingIcon from "../components/LoadingIcon";
import ProfilePicture from "../components/ProfilePicture";
import Card from "../components/Card";
import { Ionicons } from "@expo/vector-icons";

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
                    title="Log out"
                    style="primary"
                    onPress={logout}
                />
            </View>
        );
    }

    if (userType === "customer") {
        return (
            <ScrollView className="flex-1 bg-base-100 pt-1">
                

                <ScrollView className="p-5 mt-8">
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
                            customClasses="absolute -top-[54px] right-2 z-10 p-3 rounded-full pl-3"
                        />
                    </Card>
                    <Card
                        title="Help & Policies"
                        headerIcon="info"
                        >
                        <Text className="text-lg text-wrap mb-1 mt-2 text-olive-400"> Help</Text>
                        <Text className="text-lg text-wrap mb-1 mt-2 text-olive-400"> Policies</Text>
                        
                    </Card>
                    <Button
                        title="Log out"
                        style="primary"
                        onPress={logout}
                    />
                </ScrollView>
                
            </ScrollView>
        );
    }

    if (userType === "chef") {
         return (
            <ScrollView className="flex-1 bg-base-100 pt-1">
                {/* Profile Settings Button in top-right corner */}
                <Button
                    href="/ProfileSettings"
                    icon="gear"
                    customClasses="absolute top-14 right-10 z-10 p-3 rounded-full pl-5"
                />

                <ScrollView className="p-5 mt-8">
                    <Card
                        title="Profile"
                        headerIcon="person"
                        >

                        {/* Display profile picture and public user info */}
                        <ProfilePicture photoUrl={profileData.photo_url} firstName={profileData?.first_name} lastName={profileData?.last_name} />
                        <Text className="text-xl font-bold text-wrap mb-1 mt-2 text-olive-400">{profileData?.first_name} {profileData?.last_name} </Text>
                        <Text className="text-lg text-wrap text-olive-400">{userType}</Text>
                        <Text className="text-lg text-wrap text-olive-400">Cuisine: Jamaican</Text>
                        <Text className="text-lg text-wrap text-olive-400">Rating: 5/5</Text>
                        <Text className="text-lg text-wrap text-olive-400">Gender: F (private)</Text>

                        
                    </Card>

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

                    <Button
                        title="Log out"
                        style="primary"
                        onPress={logout}
                        customClasses="bottom-2 rounded-full flex-1 justify-end items-center"
                    />
                </ScrollView>
                
            </ScrollView>
        );
    }
}