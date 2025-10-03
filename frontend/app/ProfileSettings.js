import { useEffect, useState } from "react";
import { View, Text, Image } from "react-native";

// Set user ID and backend API URL
const USER_ID = 1;
const API_URL = "http://localhost:3000/profile/customer/" + USER_ID;

// ProfileSettings component displays user profile information
export default function ProfileSettings() {
  const [profile, setProfile] = useState(null); // Holds profile data
  const [error, setError] = useState(null);     // Holds error message

  // Fetch profile data from backend when component mounts
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProfile(data.profile);
      })
      .catch(() => setError("Network error"));
  }, []);

  // Show error if there is one
  if (error) return <Text className="text-red-500">{error}</Text>;
  // Show loading message while profile is being fetched
  if (!profile) return <Text>Loading...</Text>;

  // Render profile information
  return (
    <View className="flex-1 bg-base-100 p-5">
      {/* Profile title */}
      <Text className="text-2xl font-bold text-olive-500 mb-4" style={{ textAlign: "left" }}>Profile</Text>
      <View className="bg-white rounded-2xl shadow-md p-6 items-start">
        {/* Profile Picture Display */}
        <View style={{ alignItems: "flex-start", marginBottom: 20 }}>
          {profile.photo_url ? (
            // Show profile image if available
            <Image
              source={{ uri: profile.photo_url }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                marginBottom: 10,
                borderWidth: 2,
                borderColor: "#65a30d",
              }}
            />
          ) : (
            // Show placeholder if no profile image
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "#d9f99d",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 10,
                borderWidth: 2,
                borderColor: "#65a30d",
              }}
            >
              <Text className="text-olive-400 text-xl">No Photo</Text>
            </View>
          )}
          {/* Profile picture label */}
          <Text className="text-base text-olive-400" style={{ textAlign: "left" }}>Profile Picture</Text>
        </View>
        {/* Display profile fields */}
        <Text className="text-lg text-olive-400 mb-2" style={{ textAlign: "left" }}>
          Name: {profile.first_name} {profile.last_name}
        </Text>
        <Text className="text-lg text-olive-400 mb-2" style={{ textAlign: "left" }}>
          Email: {profile.email}
        </Text>
        <Text className="text-lg text-olive-400 mb-2" style={{ textAlign: "left" }}>
          Phone: {profile.phone}
        </Text>
        <Text className="text-lg text-olive-400 mb-2" style={{ textAlign: "left" }}>
          Address: {profile.full_address?.address_line1} {profile.full_address?.address_line2}, {profile.full_address?.city}, {profile.full_address?.state} {profile.full_address?.zip_code}
        </Text>
        <Text className="text-lg text-olive-400 mb-2" style={{ textAlign: "left" }}>
          Allergy Notes: {profile.allergy_notes}
        </Text>
        <Text className="text-lg text-olive-400 mb-2" style={{ textAlign: "left" }}>
          Member Since: {profile.member_since}
        </Text>
      </View>
    </View>
  );
}
