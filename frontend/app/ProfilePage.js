import { useEffect, useState } from "react";
import { View, Text } from "react-native";

// Replace with the actual user ID and backend IP/port
const USER_ID = 1;
const API_URL = "http://127.0.0.1:3000/api/profile/" + USER_ID;

{/* Displays user profile information */}
export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProfile(data);
      })
      .catch((err) => setError("Network error"));
  }, []);

  if (error) return <Text className="text-red-500">{error}</Text>;
  if (!profile) return <Text>Loading...</Text>;

  return (
    <View className="flex-1 bg-base-100 p-5">
      <Text className="text-2xl font-bold text-olive-500 mb-4">Profile</Text>
      <View className="bg-white rounded-2xl shadow-md p-6">
        <Text className="text-lg text-olive-400 mb-2">Name: {profile.name}</Text>
        <Text className="text-lg text-olive-400 mb-2">Email: {profile.email}</Text>
        <Text className="text-lg text-olive-400 mb-2">Phone: {profile.phone}</Text>
        <Text className="text-lg text-olive-400 mb-2">Address: {profile.address}</Text>
      </View>
    </View>
  );
}
