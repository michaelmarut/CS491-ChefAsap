import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ScrollView, Text, Alert, View } from "react-native";
import { Octicons } from '@expo/vector-icons';

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import LoadingIcon from "../components/LoadingIcon";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import Card from "../components/Card";

const tempImageComponent = (
    <View className="bg-base-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-olive-500 mr-4" >
        <View className="bg-white h-[200px] w-[200px] justify-center">
            <Text className="text-lg text-center text-olive-400">IMAGE GOES HERE</Text>
        </View>
        <Text className="text-olive-400 text-md pt-2 w-[200px] text-center text-justified">
            Caption goes here.
        </Text>
    </View>
);

const timing = ["Lunch", "Dinner"];
const cuisine = ["Gluten-Free", "Italian", "Vegetarian", "Vietnamese"];

export default function ChefProfileScreen() {
    const { id } = useLocalSearchParams();

    const { token, userId, profileId } = useAuth();
    const { apiUrl } = getEnvVars();

    const [chefData, setChefData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        const chefId = parseInt(id, 10);

        console.log(`Fetching profile data for Chef ID: ${chefId}`);

        const fetchProfile = async () => {
            if (!chefId) return;

            setLoading(true);
            setError(null);

            try {
                const url = `${apiUrl}/profile/chef/${chefId}/public`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    setChefData(data.profile);
                } else {
                    setError(data.error || 'Failed to load profile.');
                    Alert.alert('Error', data.error || 'Failed to load profile.');
                }
            } catch (err) {
                setError('Network error. Could not connect to API.');
                alert('Error: ' + (err.message || 'Network error. Could not connect to API.'));
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();

    }, [id]);

    if (loading) {
        return <LoadingIcon message='Loading Chef Profile...' />;
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView className="flex-1 bg-base-100 p-5 pt-12">
                {/*<Text>{JSON.stringify(chefData)}</Text>*/}
                <Card
                    title={`${chefData?.first_name} ${chefData?.last_name} `}
                    customHeader='justify-center'
                    customHeaderText='text-3xl'
                >
                    <ProfilePicture photoUrl={chefData.photo_url} firstName={chefData?.first_name} lastName={chefData?.last_name} />
                    <View className="flex-row justify-center items-center pt-2">
                        {Array.from({ length: chefData.average_rating }, (a, i) => i).map((num, index) =>
                            <Octicons
                                key={index}
                                name={"star-fill"}
                                size={24}
                                color={"#65A30D"}
                            />)}
                        {Array.from({ length: 5 - chefData.average_rating }, (a, i) => i).map((num, index) =>
                            <Octicons
                                key={index}
                                name={"star"}
                                size={24}
                                color={"#65A30D"}
                            />)}
                    </View>
                    <Text className="text-lg text-center text-olive-400 pb-2">
                        {chefData.total_ratings} Total Reviews
                        <Button
                            icon='cross-reference'
                            base='link'
                            style='transparent'
                            customClasses='p-0 pl-2 pt-3'
                            onPress={() => alert("Reviews Placeholder")}
                        />
                    </Text>
                    <Text className="text-sm text-center text-olive-400 pt-2 border-t border-olive-200">Serving Since: {chefData.member_since}</Text>
                </Card>

                <Card>
                    <Text className="text-lg text-center text-olive-400 font-semibold">Located in: {chefData.public_location} </Text>
                    <Text className="text-lg text-center text-olive-400">Distance from you: (1.5 mi. Away) </Text>
                </Card>

                <Card>
                    <Text className="text-lg text-olive-400 text-center font-semibold mb-2">Serves: {timing.join(', ')}</Text>
                    <View className="flex-row justify-center items-center w-full gap-x-1">
                        {cuisine.map((c) => (
                            <Text key={c} className="text-md text-olive-400 bg-olive-100 rounded-3xl p-1">{c}</Text>
                        ))}
                    </View>
                </Card>

                <Card
                    title="About"
                    customHeader='justify-center'
                    customHeaderText='text-xl'
                >
                    <Text className="text-lg text-center text-olive-400 text-pretty">
                        Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibu
                    </Text>
                </Card>

                <Card
                    title="Featured Dishes"
                    customHeader='justify-center'
                    customHeaderText='text-xl'
                    isScrollable={true}
                    scrollDirection='horizontal'
                    customCard="py-1"
                >
                    {tempImageComponent}
                    {tempImageComponent}
                    {tempImageComponent}
                </Card>

                <Button
                    title="View Menu"
                    style="primary"
                    customClasses="min-w-[60%]"
                    onPress={() => alert("Info Placeholder")}
                />

                <Button
                    title="← Return"
                    style="secondary"
                    href="/(tabs)/SearchScreen"
                    customClasses="min-w-[60%]"
                />
                <View className="h-24" />
            </ScrollView>
        </>
    );
}