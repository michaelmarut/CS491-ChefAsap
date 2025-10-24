import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ScrollView, Text, Alert, View, FlatList } from "react-native";
import { Octicons } from '@expo/vector-icons';

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import LoadingIcon from "../components/LoadingIcon";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import Card from "../components/Card";

const tempImageComponent = (
    <View className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mr-4" >
        <View className="bg-white h-[100px] w-[100px] justify-center">
            <Text className="text-lg text-center text-primary-400 dark:text-dark-400">IMAGE GOES HERE</Text>
        </View>
        <Text className="text-primary-400 text-md pt-2 w-[100px] text-center text-justified dark:text-dark-400">
            Caption goes here.
        </Text>
        <Button
            title={"Add to order"}
            onPress={() => alert("Added to order")}
            customClasses='rounded-xl'
        />
    </View>
);

const tempOptionsList = [
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' },
    { id: '3', title: 'Item 3' },
    { id: '4', title: 'Item 4' },
    { id: '5', title: 'Item 5' },
];

const timing = ["Lunch", "Dinner"];
const cuisine = ["Gluten-Free", "Italian", "Vegetarian", "Vietnamese"];
const distance = 3.1

export default function ChefMenu() {
    const { id } = useLocalSearchParams();

    const { token, userId, profileId } = useAuth();
    const { apiUrl } = getEnvVars();

    const [chefData, setChefData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        const chefId = parseInt(id, 10);

        console.log(`Fetching menu data for Chef ID: ${chefId}`);

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
        return <LoadingIcon message='Loading Chef Menu...' />;
    }

    const renderGridItem = ({ item }) => (
        tempImageComponent
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-12">
                {/*<Text>{JSON.stringify(chefData)}</Text>*/}
                <View className="flex justify-center items-center bg-primary-100 rounded-3xl mb-4 border-2 border-primary-100 shadow-sm shadow-primary-500 dark:bg-dark-100 dark:border-dark-100">
                    <View className="flex-row w-full justify-between items-center p-2 pl-4 pr-4">

                        <Text className="text-3xl font-bold text-primary-400 text-center dark:text-dark-400">{chefData?.first_name} {chefData?.last_name}</Text>
                        <Text className="text-md text-primary-400 dark:text-dark-400">{distance} Mi.</Text>
                    </View>


                    <View className="flex-row w-full justify-between bg-base-100 dark:bg-base-dark-100 rounded-b-3xl border-t-2 border-primary-300 dark:border-dark-300">
                        <View className="flex justify-center items-center w-1/2 bg-primary-100 pt-2 pl-4 pr-4 rounded-bl-3xl dark:bg-dark-100">
                            <View className="flex-row justify-center items-center w-full gap-x-1">
                                {cuisine.map((c) => (
                                    <Text key={c} className="text-md text-primary-400 bg-base-100 dark:bg-base-dark-100 rounded-3xl p-1 dark:text-dark-400">{c}</Text>
                                ))}
                            </View>
                            <Text className="text-md text-primary-400 pt-2 dark:text-dark-400">Available:</Text>
                            <Text className="text-md text-primary-400 pb-2 dark:text-dark-400">{timing?.join(', ')}</Text>
                        </View>
                        <View className="flex justify-center items-center w-1/2 p-4 rounded-br-3xl">
                            <ProfilePicture photoUrl={chefData?.photo_url} firstName={chefData?.first_name} lastName={chefData?.last_name} size={28} />
                            <View className="flex-row justify-center items-center pt-2">
                                {Array.from({ length: chefData?.average_rating }, (a, i) => i).map((num, index) =>
                                    <Octicons
                                        key={index}
                                        name={"star-fill"}
                                        size={24}
                                        color={"#65A30D"}
                                    />)}
                                {Array.from({ length: 5 - chefData?.average_rating }, (a, i) => i).map((num, index) =>
                                    <Octicons
                                        key={index}
                                        name={"star"}
                                        size={24}
                                        color={"#65A30D"}
                                    />)}
                            </View>
                        </View>
                    </View>
                    <Text className="text-sm text-center text-primary-400 pt-2 border-t border-primary-200 dark:text-dark-400 dark:border-dark-200 w-full">Serving Since: {chefData?.member_since}</Text>
                </View>

                <Card
                    title="Featured Dishes"
                    customHeader='justify-center'
                    customHeaderText='text-xl'
                    isScrollable={true}
                    scrollDirection='horizontal'
                    customCard="py-1"
                    isCollapsible={true}
                    startExpanded={true}
                >
                    {tempImageComponent}
                    {tempImageComponent}
                    {tempImageComponent}
                </Card>

                <Card>
                    <FlatList
                        data={tempOptionsList}
                        renderItem={renderGridItem}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        contentContainerStyle={{ padding: 8 }}
                        scrollEnabled={false}
                    />
                </Card>

                <Button
                    title="Checkout"
                    style="primary"
                    customClasses="min-w-[60%]"
                    onPress={() => alert("Checkout Placeholder")}
                />

                <Button
                    title="← Return"
                    style="secondary"
                    href={`/ChefProfileScreen/${id}`}
                    customClasses="min-w-[60%]"
                />
                <View className="h-24" />
            </ScrollView>
        </>
    );
}