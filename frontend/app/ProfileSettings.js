import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "./context/AuthContext";
import getEnvVars from "../config";
import * as ImagePicker from 'expo-image-picker';
import { Stack } from "expo-router";
import LoadingIcon from "./components/LoadingIcon";
import Card from "./components/Card";
import Button from "./components/Button";
import Input from "./components/Input";
import CustomPicker from "./components/Picker";
import ProfilePicture from "./components/ProfilePicture";

const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const filterNameCharacters = (text) => {
  const filteredText = text.replace(/[^a-zA-Z\s'-]/g, '');
  return filteredText;
};

const filterDigits = (text) => {
  return text.replace(/[^0-9]/g, '');
};

const filterAddressCharacters = (text) => {
  return text.replace(/[^a-zA-Z0-9\s.,\-\/#]/g, '');
};

const filterAlphabeticCharacters = (text) => {
  return text.replace(/[^a-zA-Z\s'-]/g, '');
};

const US_STATES = [
  { label: "State", value: "" },
  { label: "Alabama", value: "AL" },
  { label: "Alaska", value: "AK" },
  { label: "Arizona", value: "AZ" },
  { label: "Arkansas", value: "AR" },
  { label: "California", value: "CA" },
  { label: "Colorado", value: "CO" },
  { label: "Connecticut", value: "CT" },
  { label: "Delaware", value: "DE" },
  { label: "Florida", value: "FL" },
  { label: "Georgia", value: "GA" },
  { label: "Hawaii", value: "HI" },
  { label: "Idaho", value: "ID" },
  { label: "Illinois", value: "IL" },
  { label: "Indiana", value: "IN" },
  { label: "Iowa", value: "IA" },
  { label: "Kansas", value: "KS" },
  { label: "Kentucky", value: "KY" },
  { label: "Louisiana", value: "LA" },
  { label: "Maine", value: "ME" },
  { label: "Maryland", value: "MD" },
  { label: "Massachusetts", value: "MA" },
  { label: "Michigan", value: "MI" },
  { label: "Minnesota", value: "MN" },
  { label: "Mississippi", value: "MS" },
  { label: "Missouri", value: "MO" },
  { label: "Montana", value: "MT" },
  { label: "Nebraska", value: "NE" },
  { label: "Nevada", value: "NV" },
  { label: "New Hampshire", value: "NH" },
  { label: "New Jersey", value: "NJ" },
  { label: "New Mexico", value: "NM" },
  { label: "New York", value: "NY" },
  { label: "North Carolina", value: "NC" },
  { label: "North Dakota", value: "ND" },
  { label: "Ohio", value: "OH" },
  { label: "Oklahoma", value: "OK" },
  { label: "Oregon", value: "OR" },
  { label: "Pennsylvania", value: "PA" },
  { label: "Rhode Island", value: "RI" },
  { label: "South Carolina", value: "SC" },
  { label: "South Dakota", value: "SD" },
  { label: "Tennessee", value: "TN" },
  { label: "Texas", value: "TX" },
  { label: "Utah", value: "UT" },
  { label: "Vermont", value: "VT" },
  { label: "Virginia", value: "VA" },
  { label: "Washington", value: "WA" },
  { label: "West Virginia", value: "WV" },
  { label: "Wisconsin", value: "WI" },
  { label: "Wyoming", value: "WY" },
];

// ProfileSettings component displays and edits user profile information
export default function ProfileSettings() {
  const { profileId, userType } = useAuth(); // Get profileId from AuthContext
  const [profile, setProfile] = useState(null); // Holds profile data
  const [form, setForm] = useState(null);       // Holds editable form data
  const [error, setError] = useState(null);     // Holds error message
  const [editing, setEditing] = useState(false); // Edit mode
  const [uploading, setUploading] = useState(false);

  const { apiUrl } = getEnvVars();

  // Build API URL using profileId from context and config
  const privateQuery = userType === 'chef' ? '?private=true' : '';
  const API_URL = `${apiUrl}/profile/${userType}/${profileId}${privateQuery}`;
  // Fetch profile data from backend when component mounts or profileId changes
  useEffect(() => {
    if (!profileId) return;
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setProfile(data.profile);
          setForm(data.profile); // Initialize form with profile data
          // Log the profile picture URL
          console.log("Profile Picture URL:", data.profile?.photo_url);
        }
      })
      .catch(() => setError("Network error")); //Need to change to match other pages errors
  }, [profileId, API_URL]);

  // Handle input changes for top-level fields
  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  // Handle input changes for address fields
  const handleAddressChange = (field, value) => {
    setForm({
      ...form,
      full_address: {
        ...form.full_address,
        [field]: value,
      },
    });
  };

  // Save updated info to backend
  const handleSave = () => {
    // Flatten address fields for backend
    const payload = {
      ...form,
      address_line1: form.full_address?.address_line1 || "",
      address_line2: form.full_address?.address_line2 || "",
      city: form.full_address?.city || "",
      state: form.full_address?.state || "",
      zip_code: form.full_address?.zip_code || "",
    };
    delete payload.full_address;
    delete payload.email; // Email not editable

    fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setProfile({ ...profile, ...form });
          setEditing(false);
        }
      })
      .catch(() => setError("Network error"));
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery was denied');
      return;
    }

    // Pick image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploading(true);
      const localUri = result.assets[0].uri;
      const filename = localUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      // Prepare FormData
      const formData = new FormData();
      formData.append('photo', {
        uri: localUri,
        name: filename,
        type,
      });

      // Upload to backend
      try {
        const uploadUrl = `${apiUrl}/profile/${userType}/${profileId}/photo`;
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });
        const data = await response.json();
        if (data.photo_url) {
          // Update profile with new photo_url
          setProfile({ ...profile, photo_url: data.photo_url });
          setForm({ ...form, photo_url: data.photo_url });
        } else {
          alert('Failed to upload image');
        }
      } catch (error) {
        alert('Error uploading image');
      }
      setUploading(false);
    }
  };

  // Show error if there is one
  if (error) return <Text className="text-red-500">{error}</Text>;
  // Show loading message while profile is being fetched
  if (!profile || !form) return <LoadingIcon message="Loading User Profile..." />;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1 bg-base-100 p-5 pt-12">
        {/* Profile title */}
        {/* Profile Picture Display */}
        <Card title="Profile" headerIcon="gear" customClasses="w-full">
          <TouchableOpacity className="items-center" onPress={pickImage} disabled={uploading || !editing}>
            <ProfilePicture photoUrl={profile.photo_url} firstName={profile?.first_name} lastName={profile?.last_name} />
            {editing &&
              <Text className="text-base text-primary-400 underline pt-2 dark:text-dark-400" style={{ textAlign: "left" }}>
                {uploading ? "Uploading..." : "Tap to change profile picture"}
              </Text>
            }
          </TouchableOpacity>

        </Card>
        {/*<Text>PROFILE {JSON.stringify(profile)}</Text>*/}

        {/* Editable fields */}
        {editing ? (
          <>
            <Card title="Personal Information" headerIcon="person" customClasses="w-full">
              <Text className="text-sm font-semibold mb-1 mt-2 text-primary-400 dark:text-dark-400">Name</Text>
              <View className="flex-row justify-between">
                <Input
                  placeholder="First Name"
                  value={form.first_name}
                  onChangeText={v => handleChange("first_name", filterNameCharacters(v))}
                  containerClasses="flex-1 mx-0.5 mb-2 mt-0"
                />

                <Input
                  placeholder="Last Name"
                  value={form.last_name}
                  onChangeText={v => handleChange("last_name", filterNameCharacters(v))}
                  containerClasses="flex-1 mx-0.5 mb-2 mt-0"
                />
              </View>

              <Text className="text-sm font-semibold mb-1 mt-2 text-primary-400 dark:text-dark-400">Email Address</Text>
              <Text className="border border-gray-300 bg-white rounded-full py-3 px-4 text-base text-gray-400">
                {profile.email}
              </Text>

              <Input label="Phone Number"
                value={form.phone}
                onChangeText={v => handleChange("phone", v)}
                keyboardType="phone-pad"
                placeholder="(555) 123-4567"
                maxLength={10}
              />
            </Card>

            <Card title={"Your Address"} headerIcon="location" customClasses="w-full">
              <Input
                label="Street Address"
                placeholder="123 Main Street"
                value={form.full_address?.address_line1 || ""}
                onChangeText={v => handleAddressChange("address_line1", v)}
              />

              <Input
                label="Apartment, Suite, etc. (Optional)"
                placeholder="Apt 4B, Suite 200, etc."
                value={form.full_address?.address_line2 || ""}
                onChangeText={v => handleAddressChange("address_line2", v)}
              />

              <Input
                label="City"
                placeholder="City"
                value={form.full_address?.city || ""}
                onChangeText={v => handleAddressChange("city", v)}
              />

              <View className="flex-row justify-between">
                <CustomPicker
                  label="State"
                  prompt="Select a State"
                  selectedValue={form.full_address?.state}
                  onValueChange={(v) => handleAddressChange("state", v)}
                  items={US_STATES}
                />

                <View className="flex-1 ml-3">
                  <Input
                    label="Zip Code"
                    placeholder="12345"
                    value={form.full_address?.zip_code || ""}
                    onChangeText={v => handleAddressChange("zip_code", v)}
                    keyboardType="numeric"
                    maxLength={5}
                    customClasses="text-center"
                    containerClasses="mb-2"
                  />
                </View>
              </View>
            </Card>

            <Card title={"Other"} headerIcon="three-bars" customClasses="w-full">
              <Input
                value={form.allergy_notes}
                onChangeText={v => handleChange("allergy_notes", v)}
                label="Allergy Notes"
                placeholder="Allergy Notes"
                isTextArea={true}
              />
              <Text className="text-sm font-semibold mb-1 mt-2 text-primary-400 dark:text-dark-400">Member Since</Text>
              <Text className="border border-gray-300 bg-white rounded-full py-3 px-4 text-base text-gray-400">{profile.member_since}</Text>
            </Card>

            <Button
              title="Save"
              onPress={handleSave}
              customClasses="min-w-[50%]"
            />
            <Button
              title="Cancel"
              onPress={() => { setEditing(false); setForm(profile); }}
              style="secondary"
              customClasses="min-w-[50%]"
            />
          </>
        ) : (
          <>
            <Card title="Personal Information" headerIcon="person" customClasses="w-full">
              <Text className="text-lg text-primary-400 mb-2 dark:text-dark-400" style={{ textAlign: "left" }}>
                <Text className="font-semibold">Name: </Text> {profile.first_name} {profile.last_name}
              </Text>
              <Text className="text-lg text-primary-400 mb-2 dark:text-dark-400" style={{ textAlign: "left" }}>
                <Text className="font-semibold">Email: </Text> {profile.email}
              </Text>
              <Text className="text-lg text-primary-400 mb-2 dark:text-dark-400" style={{ textAlign: "left" }}>
                <Text className="font-semibold">Phone: </Text> {profile.phone}
              </Text>
            </Card>
            <Card title="Your Address" headerIcon="location" customClasses="w-full">
              <Text className="text-lg text-primary-400 mb-2 dark:text-dark-400" style={{ textAlign: "left" }}>
                <Text className="font-semibold">Address{profile.full_address?.address_line2 && " 1"}: </Text>{profile.full_address?.address_line1}
              </Text>
              {profile.full_address?.address_line2 &&
                <Text className="text-lg text-primary-400 mb-2 dark:text-dark-400" style={{ textAlign: "left" }}>
                  <Text className="font-semibold">Address 2: </Text>{profile.full_address?.address_line2}
                </Text>
              }
              <Text className="text-lg text-primary-400 mb-2 dark:text-dark-400" style={{ textAlign: "left" }}>
                <Text className="font-semibold">City: </Text>{profile.full_address?.city}
              </Text>
              <Text className="text-lg text-primary-400 mb-2 dark:text-dark-400" style={{ textAlign: "left" }}>
                <Text className="font-semibold">State: </Text>{US_STATES.find(state => state.value === profile.full_address?.state)?.label}
              </Text>
              <Text className="text-lg text-primary-400 mb-2 dark:text-dark-400" style={{ textAlign: "left" }}>
                <Text className="font-semibold">Zip Code: </Text>{profile.full_address?.zip_code}
              </Text>
            </Card>
            <Card title={"Other"} headerIcon="three-bars" customClasses="w-full">

              <Text className="text-lg text-primary-400 mb-2 dark:text-dark-400" style={{ textAlign: "left" }}>
                <Text className="font-semibold">Allergy Notes: </Text>{profile.allergy_notes || "None"}
              </Text>
              <Text className="text-lg text-primary-400 mb-2 dark:text-dark-400" style={{ textAlign: "left" }}>
                <Text className="font-semibold">Member Since: </Text>{profile.member_since}
              </Text>
            </Card>
            <Button
              title="Edit Information"
              onPress={() => setEditing(true)}
              customClasses="min-w-[60%]"
            />
            <Button
              title="← Return"
              style="secondary"
              href="/(tabs)/Profile"
              customClasses="min-w-[60%]"
            />
          </>
        )}
        <View className="h-24" />
      </ScrollView>
    </>
  );
}