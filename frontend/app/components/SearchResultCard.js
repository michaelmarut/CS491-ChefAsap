import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import ProfilePicture from './ProfilePicture';
import Button from './Button';

export default function Card({
    chef_id,
    first_name,
    last_name,
    distance,
    cuisine,
    timing,
    rating,
}) {
    const [profileData, setProfileData] = useState(null);
    const { token } = useAuth();

    const { apiUrl } = getEnvVars();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        const fetchProfile = async () => {
            if (!chef_id) return;

            setLoading(true);
            setError(null);

            try {
                const url = `${apiUrl}/profile/chef/${chef_id}`;

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
                    alert('Error', data.error || 'Failed to load profile.');
                }
            } catch (err) {
                setError('Network error. Could not connect to API.');
                alert('Error: ' + (err.message || 'Network error. Could not connect to API.'));
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [chef_id]);

    return (
        <View className="flex justify-center items-center bg-primary-100 rounded-3xl mb-4 border-2 border-primary-100 shadow-sm shadow-primary-500 dark:bg-dark-100 dark:border-dark-100">
            <View className="flex-row w-full justify-between items-center p-2 pl-4 pr-4">

                <Text className="text-3xl font-bold text-primary-400 text-center dark:text-dark-400">{profileData?.first_name} {profileData?.last_name}</Text>
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
                    <Text className="text-md text-primary-400 pb-2 dark:text-dark-400">{timing.join(', ')}</Text>
                    <Button
                        title={"View Chef "}
                        style={"accent"}
                        href={`/ChefProfileScreen/${chef_id}`}
                        icon={"link-external"}
                        customClasses="w-full rounded-3xl"
                        customTextClasses='text-sm font-medium'
                        iconGap={6}
                    />
                </View>
                <View className="flex justify-center items-center w-1/2 p-4 rounded-br-3xl">
                    <ProfilePicture photoUrl={profileData?.photo_url} firstName={profileData?.first_name} lastName={profileData?.last_name} size={28} />
                    <View className="flex-row justify-center items-center pt-2">
                        {Array.from({ length: rating }, (a, i) => i).map((num, index) =>
                            <Octicons
                                key={index}
                                name={"star-fill"}
                                size={24}
                                color={"#65A30D"}
                            />)}
                        {Array.from({ length: 5 - rating }, (a, i) => i).map((num, index) =>
                            <Octicons
                                key={index}
                                name={"star"}
                                size={24}
                                color={"#65A30D"}
                            />)}
                    </View>
                </View>
            </View>
        </View>


    );
}