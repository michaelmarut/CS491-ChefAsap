import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import getEnvVars from '../config';

export default function ProfilePage({ userType = 'customer', userId = 1 }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const { apiUrl } = getEnvVars();

  useEffect(() => {
    loadProfile();
  }, [userType, userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const url = `${apiUrl}/api/profile/${userType}/${userId}`;
      console.log('Fetching profile from:', url); // Debug log
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Profile response:', response.status, data); // Debug log
      
      if (response.ok) {
        setProfile(data);
        setEditedProfile(data);
      } else {
        console.error('Profile API error:', data); // Debug log
        Alert.alert('Error', data.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Profile network error:', error); // Debug log
      Alert.alert('Error', 'Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/profile/${userType}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      });

      const data = await response.json();
      
      if (response.ok) {
        setProfile(editedProfile);
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', data.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setEditing(false);
  };

  const updateField = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderField = (label, field, value, multiline = false, editable = true) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing && editable ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.multilineInput]}
          value={editedProfile[field] || ''}
          onChangeText={(text) => updateField(field, text)}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <Text style={styles.fieldValue}>
          {value || 'Not provided'}
        </Text>
      )}
    </View>
  );

  const formatDateTime = (datetime) => {
    if (!datetime) return 'Not available';
    return new Date(datetime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatGender = (gender) => {
    if (!gender) return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1).replace('_', ' ');
  };

  const renderCuisines = () => {
    if (!profile?.cuisines || profile.cuisines.length === 0) {
      return <Text style={styles.fieldValue}>No cuisines specified</Text>;
    }
    
    return (
      <View style={styles.cuisinesContainer}>
        {profile.cuisines.map((cuisine, index) => (
          <View key={cuisine.id} style={styles.cuisineTag}>
            <Text style={styles.cuisineText}>{cuisine.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAddresses = () => {
    if (!profile?.addresses || profile.addresses.length === 0) {
      return <Text style={styles.fieldValue}>No addresses on file</Text>;
    }

    return profile.addresses.map((address, index) => (
      <View key={address.id} style={styles.addressContainer}>
        <View style={styles.addressHeader}>
          <Text style={styles.addressType}>
            Address {index + 1} {address.is_default ? '(Default)' : ''}
          </Text>
        </View>
        <Text style={styles.addressText}>
          {address.address_line1}
          {address.address_line2 ? `\n${address.address_line2}` : ''}
          {'\n'}{address.city}, {address.state} {address.zip_code}
        </Text>
      </View>
    ));
  };

  const renderAvailability = () => {
    if (!profile?.availability || profile.availability.length === 0) {
      return <Text style={styles.fieldValue}>No availability set</Text>;
    }

    return profile.availability.map((slot, index) => (
      <View key={slot.id} style={styles.availabilitySlot}>
        <Text style={styles.dayText}>{slot.day_of_week.charAt(0).toUpperCase() + slot.day_of_week.slice(1)}</Text>
        <Text style={styles.timeText}>{slot.start_time} - {slot.end_time}</Text>
      </View>
    ));
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4d7c0f" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {userType.charAt(0).toUpperCase() + userType.slice(1)} Profile
        </Text>
        <View style={styles.headerButtons}>
          {editing ? (
            <>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Profile info header */}
      <View style={styles.profileInfoHeader}>
        <Text style={styles.profileTypeText}>
          {userType === 'customer' ? 'Customer Profile' : 'Chef Profile'}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          {renderField('First Name', 'first_name', profile.first_name)}
          {renderField('Last Name', 'last_name', profile.last_name)}
          {renderField('Email', 'email', profile.email, false, false)}
          {renderField('Phone', 'phone', profile.phone)}
          
          {userType === 'chef' && (
            <>
              {renderField('City', 'city', profile.city)}
              {renderField('Residency', 'residency', profile.residency)}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <Text style={styles.fieldValue}>{formatGender(profile.gender)}</Text>
              </View>
              {renderField('Hourly Rate', 'hourly_rate', profile.hourly_rate ? `$${profile.hourly_rate}` : '')}
              {renderField('Bio', 'bio', profile.bio, true)}
            </>
          )}
          
          {userType === 'customer' && (
            <>
              {renderField('Allergy Notes', 'allergy_notes', profile.allergy_notes, true)}
              {renderField('Dietary Preferences', 'dietary_preferences', profile.dietary_preferences, true)}
              {renderField('Preferred Cuisines', 'preferred_cuisine_types', profile.preferred_cuisine_types, true)}
            </>
          )}
        </View>

        {/* Chef-specific sections */}
        {userType === 'chef' && (
          <>
            {/* Cuisines */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specializes In</Text>
              {renderCuisines()}
            </View>

            {/* Availability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Availability Schedule</Text>
              {renderAvailability()}
            </View>

            {/* Rating Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Stats</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.average_rating || '0.00'}</Text>
                  <Text style={styles.statLabel}>Average Rating</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.total_reviews || 0}</Text>
                  <Text style={styles.statLabel}>Total Reviews</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Addresses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          {renderAddresses()}
        </View>

        {/* Social Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          {renderField('Facebook', 'facebook_link', profile.facebook_link)}
          {renderField('Instagram', 'instagram_link', profile.instagram_link)}
          {renderField('Twitter', 'twitter_link', profile.twitter_link)}
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Member Since</Text>
            <Text style={styles.fieldValue}>
              {formatDateTime(profile.user_created_at)}
            </Text>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Last Updated</Text>
            <Text style={styles.fieldValue}>
              {formatDateTime(profile.updated_at)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4d7c0f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3f3f1f',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#4d7c0f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileInfoHeader: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  profileTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4d7c0f',
    textAlign: 'center',
  },

  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3f3f1f',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  cuisinesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineTag: {
    backgroundColor: '#4d7c0f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cuisineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addressContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  addressHeader: {
    marginBottom: 4,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4d7c0f',
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  availabilitySlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4d7c0f',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});