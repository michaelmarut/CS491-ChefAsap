import { useEffect, useState } from "react";
import { ScrollView, Text, View, Alert } from "react-native";

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import LoadingIcon from "../components/LoadingIcon";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import Card from "../components/Card";
import ThemeButton from "../components/ThemeButton";
import RatingsDisplay from "../components/RatingsDisplay";

const timing = ["Lunch", "Dinner"];
const cuisine = ["Gluten-Free", "Italian", "Vegetarian", "Vietnamese", "Desserts", "BBQ"];

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
            <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100">
                <LoadingIcon message="Loading Profile..." />
                <Button
                    title="Log out"
                    style="primary"
                    customClasses="min-w-[50%]"
                    onPress={logout}
                />
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100">
                <Text className="text-lg text-red-500">Error: {error}</Text>
                <Button
                    title="Log out"
                    style="primary"
                    customClasses="min-w-[50%]"
                    onPress={logout}
                />
            </View>
        );
    }


    return (
        <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-12">
            {/*console.log(JSON.stringify(profileData))*/}
            <Card
                title="Profile"
                headerIcon="person"
            >
                <Button
                    href="/ProfileSettings"
                    icon="gear"
                    style="accent"
                    customClasses="absolute -top-[70px] -right-2 z-10 p-3 rounded-full pl-3"
                />
                <ThemeButton />

                <ProfilePicture photoUrl={profileData?.photo_url} firstName={profileData?.first_name} lastName={profileData?.last_name} />
                <Text className="text-xl font-bold text-wrap text-center mb-1 mt-2 text-primary-400 dark:text-dark-400">{profileData?.first_name} {profileData?.last_name} </Text>
                <Text className="text-lg text-wrap text-center text-primary-400 dark:text-dark-400">{userType?.charAt(0).toUpperCase() + userType?.slice(1)}</Text>
                {userType === 'chef' && (
                    <>
                        
                        <RatingsDisplay rating={profileData?.avg_rating} />
                        <Text className="text-lg text-center text-primary-400 pb-2 dark:text-dark-400">
                            {profileData?.total_reviews} Total Reviews
                            <Button
                                icon='cross-reference'
                                base='link'
                                style='transparent'
                                customClasses='p-0 pl-2 pt-3'
                                onPress={() => alert("Reviews Placeholder")}
                            />
                        </Text>
                    </>
                )}
                <Text className="text-sm text-center text-primary-400 pt-2 border-t border-primary-200 dark:text-dark-400 dark:border-dark-200">Member Since: {profileData?.member_since}</Text>
            </Card>

            {userType === "customer" ? (
                <>
                    <Card
                        title="Help & Policies"
                        headerIcon="info"
                    >
                        <Text className="text-lg text-wrap mb-1 mt-2 text-primary-400 dark:text-dark-400"> Help</Text>
                        <Text className="text-lg text-wrap mb-1 mt-2 text-primary-400 dark:text-dark-400"> Policies</Text>

                    </Card>
                </>
            ) : (
                <>
                    <Card
                            title="Chef Details"
                            customHeader='justify-center'
                            customHeaderText='text-xl'
                            >
                            <Button
                                icon="paintbrush"
                                style="accent"
                                customClasses="absolute -top-[70px] -right-2 z-10 p-3 rounded-full pl-3"
                            />
                        <Text className="text-lg text-primary-400 text-center font-semibold mb-2 dark:text-dark-400">Serves: {timing.join(', ')}</Text>
                        <View className="flex-row flex-wrap justify-center items-center w-full gap-1">
                            {cuisine.map((c) => (
                                <Text key={c} className="text-md text-primary-400 bg-primary-100 rounded-3xl p-1 dark:text-dark-400 dark:bg-dark-100">{c}</Text>
                            ))}
                        </View>
                    </Card>

                    <Card
                        title="About"
                        customHeader='justify-center'
                        customHeaderText='text-xl'
                    >
                        <Button
                            icon="paintbrush"
                            style="accent"
                            customClasses="absolute -top-[70px] -right-2 z-10 p-3 rounded-full pl-3"
                        />
                        <Text className="text-lg text-center text-primary-400 text-pretty dark:text-dark-400">
                            Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibu
                        </Text>
                    </Card>
                    <Button
                        title="Manage Menu"
                        style="primary"
                        customClasses="min-w-[60%]"
                        href={`/ChefMenuScreen`}
                    />
                    <Button
                        title="Customer View"
                        style="secondary"
                        customClasses="min-w-[60%]"
                        href={`/ChefProfileScreen/${profileId}`}
                    />
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