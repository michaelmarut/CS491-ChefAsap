import React, { useEffect, useState, useMemo } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ScrollView, Text, Alert, View, FlatList } from "react-native";
import { Octicons } from '@expo/vector-icons';

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import LoadingIcon from "../components/LoadingIcon";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import Card from "../components/Card";
import TagsBox from '../components/TagsBox';
import RatingsDisplay from '../components/RatingsDisplay';

const tempFeatureComponent = (
    <View className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mr-4 " >
        <View className="bg-white h-[100px] w-[100px] justify-center">
            <Text className="text-lg text-center text-primary-400 dark:text-dark-400">IMAGE GOES HERE</Text>
        </View>
        <Text className="text-primary-400 text-md pt-2 mb-2 w-[100px] text-center text-justified dark:text-dark-400">
            Food Name
        </Text>
        <Button
            title={"Add to order"}
            onPress={() => alert("Added to order")}
            customClasses='rounded-xl'
            customTextClasses='text-sm'
        />
    </View>
);

const tempMenuComponent = ({ item }) => (
    <View className="bg-base-100 dark:bg-base-dark-100 flex p-4 pb-2 rounded-xl shadow-sm shadow-primary-500 mb-4 w-[48%]">
        <View className="bg-white h-[100px] w-full justify-center">
            <Text className="text-lg text-center text-primary-400 dark:text-dark-400">IMAGE GOES HERE</Text>
        </View>
        <Text className="text-primary-400 text-md pt-2 mb-2 w-full text-center text-justified dark:text-dark-400">
            {item?.name || 'Food Name'}
        </Text>
        <Button
            title={"Add to order"}
            onPress={() => alert("Added to order")}
            customClasses='rounded-xl'
            customTextClasses='text-sm'
        />
    </View>
);

const tempOptionsList = {
    'Fruits': [
        { id: 'f1', name: 'Apple' },
        { id: 'f2', name: 'Banana' },
        { id: 'f3', name: 'Grape' },
        { id: 'f4', name: 'Orange' },
    ],
    'Vegetables': [
        { id: 'v1', name: 'Carrot' },
        { id: 'v2', name: 'Broccoli' },
        { id: 'v3', name: 'Spinach' },
        { id: 'v4', name: 'Cabbage' },
        { id: 'v5', name: 'Peppers' },
        { id: 'v6', name: 'Cucumber' },
    ],
};

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

    const renderGridItem = ({ item }) => (
        tempMenuComponent({ item })
    );

    if (loading) {
        return (
            <View className="flex-1 bg-base-100 dark:bg-base-dark-100 pb-16 items-center justify-center">
                <LoadingIcon message='Loading Chef Menu...' />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5 pt-12">
                {/*<Text>{JSON.stringify(chefData)}</Text>*/}
                <View className="flex justify-center items-center bg-primary-100 dark:bg-dark-100 rounded-3xl mb-4 border-2 shadow-sm shadow-primary-500 border-primary-100 dark:border-dark-100">
                    <View className="flex-row w-full justify-between items-center p-2 pl-4 pr-4">
                        <Text className="text-3xl font-bold text-primary-400 text-center dark:text-dark-400">{chefData?.first_name} {chefData?.last_name}</Text>
                        <Text className="text-md text-primary-400 dark:text-dark-400">{distance} Mi.</Text>
                    </View>


                    <View className="flex-row w-full justify-between bg-base-100 dark:bg-base-dark-100 border-t-2 border-primary-300 dark:border-dark-300">
                        <View className="flex justify-center items-center w-1/2 bg-primary-100 pt-2 pl-4 pr-4 dark:bg-dark-100">
                            <TagsBox words={cuisine} />
                            <Text className="text-md text-primary-400 pt-2 dark:text-dark-400">Available:</Text>
                            <Text className="text-md text-primary-400 pb-2 dark:text-dark-400">{timing?.join(', ')}</Text>
                        </View>
                        <View className="flex justify-center items-center w-1/2 p-4 rounded-br-3xl">
                            <ProfilePicture photoUrl={chefData?.photo_url} firstName={chefData?.first_name} lastName={chefData?.last_name} size={28} />
                            <RatingsDisplay rating={chefData?.average_rating} />
                        </View>
                    </View>
                    <Text className="text-sm text-center text-primary-400 dark:text-dark-400 py-2 border-t-2 border-primary-300 dark:border-dark-300 w-full">Last Updated: {chefData?.member_since}</Text>
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
                    {tempFeatureComponent}
                    {tempFeatureComponent}
                    {tempFeatureComponent}
                </Card>

                {Object.entries(tempOptionsList).map(([key, value]) => (
                    <Card
                        key={key}
                        title={key}
                        isCollapsible={true}
                        customHeader='justify-center'
                    >
                        <FlatList
                            data={value}
                            renderItem={renderGridItem}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            columnWrapperStyle={{ justifyContent: 'space-between', width: '100%' }}
                            scrollEnabled={false}
                        />
                    </Card>
                ))}
                
                <Button
                    title="View Order"
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