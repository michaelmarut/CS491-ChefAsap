import { useEffect, useState } from "react";
import { View, Text, Image, TextInput, Button, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "./context/AuthContext";
import getEnvVars from "../config";
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// ProfileSettings component displays and edits user profile information
export default function ProfileSettings() {
  const { userId } = useAuth(); // Get userId from AuthContext
  const [profile, setProfile] = useState(null); // Holds profile data
  const [form, setForm] = useState(null);       // Holds editable form data
  const [error, setError] = useState(null);     // Holds error message
  const [editing, setEditing] = useState(false); // Edit mode
  const [uploading, setUploading] = useState(false);

  const { apiUrl } = getEnvVars();

  // Build API URL using userId from context and config
  const API_URL = `${apiUrl}/profile/customer/${userId}`;

  // Fetch profile data from backend when component mounts or userId changes
  useEffect(() => {
    if (!userId) return;
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
  }, [userId, API_URL]);

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
        const uploadUrl = `${apiUrl}/profile/customer/${userId}/photo`;
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
  if (!profile || !form) return <Text>Loading...</Text>;

  return (
    <ScrollView className="flex-1 bg-base-100 p-5">
      {/* Profile title */}
      <Text className="text-2xl font-bold text-olive-500 mb-4" style={{ textAlign: "left" }}>Profile</Text>
      <View className="bg-white rounded-2xl shadow-md p-6 items-start">
        {/* Profile Picture Display */}
        <View style={{ alignItems: "flex-start", marginBottom: 20 }}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            {profile.photo_url ? (
              // Show profile image if available
              <Image
                source={{ uri: `${apiUrl}${profile.photo_url}` }}
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
            <Text className="text-base text-olive-400" style={{ textAlign: "left" }}>
              {uploading ? "Uploading..." : "Tap to change profile picture"}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Editable fields */}
        {editing ? (
          <>
            <TextInput
              style={{ marginBottom: 8, backgroundColor: "#fef9c3", borderRadius: 6, paddingHorizontal: 8 }}
              value={form.first_name}
              onChangeText={v => handleChange("first_name", v)}
              placeholder="First Name"
            />
            <TextInput
              style={{ marginBottom: 8, backgroundColor: "#fef9c3", borderRadius: 6, paddingHorizontal: 8 }}
              value={form.last_name}
              onChangeText={v => handleChange("last_name", v)}
              placeholder="Last Name"
            />
            <Text style={{ marginBottom: 8 }}>Email: {profile.email}</Text>
            <TextInput
              style={{ marginBottom: 8, backgroundColor: "#fef9c3", borderRadius: 6, paddingHorizontal: 8 }}
              value={form.phone}
              onChangeText={v => handleChange("phone", v)}
              placeholder="Phone"
            />
            <TextInput
              style={{ marginBottom: 8, backgroundColor: "#fef9c3", borderRadius: 6, paddingHorizontal: 8 }}
              value={form.allergy_notes}
              onChangeText={v => handleChange("allergy_notes", v)}
              placeholder="Allergy Notes"
            />
            <TextInput
              style={{ marginBottom: 8, backgroundColor: "#fef9c3", borderRadius: 6, paddingHorizontal: 8 }}
              value={form.full_address?.address_line1 || ""}
              onChangeText={v => handleAddressChange("address_line1", v)}
              placeholder="Address Line 1"
            />
            <TextInput
              style={{ marginBottom: 8, backgroundColor: "#fef9c3", borderRadius: 6, paddingHorizontal: 8 }}
              value={form.full_address?.address_line2 || ""}
              onChangeText={v => handleAddressChange("address_line2", v)}
              placeholder="Address Line 2"
            />
            <TextInput
              style={{ marginBottom: 8, backgroundColor: "#fef9c3", borderRadius: 6, paddingHorizontal: 8 }}
              value={form.full_address?.city || ""}
              onChangeText={v => handleAddressChange("city", v)}
              placeholder="City"
            />
            <TextInput
              style={{ marginBottom: 8, backgroundColor: "#fef9c3", borderRadius: 6, paddingHorizontal: 8 }}
              value={form.full_address?.state || ""}
              onChangeText={v => handleAddressChange("state", v)}
              placeholder="State"
            />
            <TextInput
              style={{ marginBottom: 8, backgroundColor: "#fef9c3", borderRadius: 6, paddingHorizontal: 8 }}
              value={form.full_address?.zip_code || ""}
              onChangeText={v => handleAddressChange("zip_code", v)}
              placeholder="Zip Code"
            />
            <Button title="Save" onPress={handleSave} />
            <Button title="Cancel" onPress={() => { setEditing(false); setForm(profile); }} />
          </>
        ) : (
          <>
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
            <Button title="Edit Information" onPress={() => setEditing(true)} />
          </>
        )}
      </View>
    </ScrollView>
  );
}
