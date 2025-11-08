import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';

import getEnvVars from "../../config";
import { useAuth } from "../context/AuthContext";

import LoadingIcon from './LoadingIcon';
import ProfilePicture from './ProfilePicture';
import Button from './Button';
import TagsBox from './TagsBox';
import RatingsDisplay from './RatingsDisplay';

export default function SearchResultCard({
    chef_id,
    first_name,
    last_name,
    distance,
    cuisine,
    timing,
    rating,
}) {
    const [photoData, setPhotoData] = useState(null);
    const { token } = useAuth();

    const { apiUrl } = getEnvVars();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        const fetchPhoto = async () => {
            if (!chef_id) return;

            setLoading(true);
            setError(null);

            try {
                const url = `${apiUrl}/profile/chef/${chef_id}/photo`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    setPhotoData(data.photo_url);
                } else {
                    setError(data.error || 'Failed to load profile picture.');
                    alert('Error', data.error || 'Failed to load profile picture.');
                }
            } catch (err) {
                setError('Network error. Could not connect to API.');
                alert('Error: ' + (err.message || 'Network error. Could not connect to API.'));
            } finally {
                setLoading(false);
            }
        };

        fetchPhoto();
    }, [chef_id]);

    return (
        <View className="flex justify-center items-center bg-primary-100 rounded-3xl mb-4 border-2 border-primary-100 shadow-sm shadow-primary-500 dark:bg-dark-100 dark:border-dark-100">

            <View className="flex-row w-full justify-between items-center p-2 pl-4 pr-4">
                <Text className="text-3xl font-bold text-primary-400 text-center dark:text-dark-400">{first_name} {last_name}</Text>
                <Text className="text-md text-primary-400 dark:text-dark-400">{distance} Mi.</Text>
            </View>

            {loading ?
                <View className="h-[100px] w-full justify-center items-center pt-4 mb-4 bg-primary-100 dark:bg-dark-100 border-t-2 border-primary-300 dark:border-dark-300">
                    <LoadingIcon message='' icon='spinner' size={64} />
                </View>
                :
                <View className="flex-row w-full justify-between bg-base-100 dark:bg-base-dark-100 rounded-b-3xl border-t-2 border-primary-300 dark:border-dark-300">
                    <View className="flex justify-center items-center w-1/2 bg-primary-100 pt-2 px-1 rounded-bl-3xl dark:bg-dark-100">
                        <TagsBox words={cuisine} />
                        <Text className="text-md text-primary-400 dark:text-dark-400 pt-2">Available:</Text>
                        <Text className="text-md text-primary-400 dark:text-dark-400 pb-2 text-wrap">{timing.join(', ')}</Text>
                        <Button
                            title={"View Chef "}
                            style={"accent"}
                            href={`/ChefProfileScreen/${chef_id}`}
                            icon={"link-external"}
                            customClasses="w-[90%] rounded-3xl"
                            customTextClasses='text-sm font-medium'
                            iconGap={6}
                        />
                    </View>
                    <View className="flex justify-center items-center w-1/2 p-4 rounded-br-3xl">
                        <ProfilePicture photoUrl={photoData} firstName={first_name} lastName={last_name} size={28} />
                        <RatingsDisplay rating={rating} />
                    </View>
                </View>
            }
        </View>
    );
}