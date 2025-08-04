import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert, TextInput, Modal } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import LandingPage from './index';
import getEnvVars from '../config';

function ChefDashboardContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [editedProfile, setEditedProfile] = useState({...profileData});
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [editedCuisines, setEditedCuisines] = useState([]);
  const [showCuisineModal, setShowCuisineModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [chefData, setChefData] = useState({
    name: 'Chef Name',
    email: 'chef@example.com',
    specialties: [],
    rating: 4.8,
    completedOrders: 127
  });
  
  const { apiUrl } = getEnvVars();
  
  const cuisineTypes = [
    'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 'French',
    'Mediterranean', 'American', 'Caribbean', 'Korean', 'Vietnamese', 'Greek'
  ];

  useEffect(() => {
    fetchProfileData();
  }, []);



  // Fetch user profile data from backend
  const fetchProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        return;
      }
      
      setAuthToken(token);
      
      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }
      
      setProfileData(data);
      setEditedProfile(data);
      setIsLoading(false);
      
      // Also update chef data for dashboard
      setChefData({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        specialties: ['Italian', 'Mediterranean'], // This would come from backend
        rating: 4.8, // This would come from backend
        completedOrders: 127 // This would come from backend
      });
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data: ' + error.message);
      setIsLoading(false);
    }
  };

  // Handle profile editing
  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditedProfile({...profileData});
    setEditedCuisines([...selectedCuisines]);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedProfile({...profileData});
    setEditedCuisines([...selectedCuisines]);
  };

  const toggleCuisine = (cuisine) => {
    setEditedCuisines(prev => {
      if (prev.includes(cuisine)) {
        return prev.filter(c => c !== cuisine);
      } else {
        return [...prev, cuisine];
      }
    });
  };

  const handleSaveProfile = async () => {
    try {
      // Save basic profile data with cuisine specialties
      const profileDataWithCuisines = {
        ...editedProfile,
        cuisines: editedCuisines
      };
      
      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileDataWithCuisines),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      // TODO: Save cuisine specialties to backend
      // This would require a separate API endpoint for chef cuisines
      // For now, we'll just update the local state
      
      setProfileData(editedProfile);
      setSelectedCuisines(editedCuisines);
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile: ' + error.message);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('authToken');
              setCurrentView('landing');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    );
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      
      // Validate form
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        Alert.alert('Error', 'Please fill in all password fields');
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        Alert.alert('Error', 'New passwords do not match');
        return;
      }
      
      if (passwordData.newPassword.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters long');
        return;
      }
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }
      
      const response = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const renderDashboard = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Chef Dashboard</Text>
      
      {/* Menu Options */}
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setCurrentView('bookingRequests')}
        >
          <Text style={styles.menuButtonText}>📋 Booking Requests</Text>
          <Text style={styles.menuButtonSubtext}>View and manage customer requests</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => Alert.alert('My Bookings', 'View your confirmed bookings and schedule.')}
        >
          <Text style={styles.menuButtonText}>📅 My Bookings</Text>
          <Text style={styles.menuButtonSubtext}>Manage your confirmed bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setCurrentView('profile')}
        >
          <Text style={styles.menuButtonText}>👨‍🍳 Chef Profile</Text>
          <Text style={styles.menuButtonSubtext}>Update profile and specialties</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => Alert.alert('Availability', 'Set your available dates and times for bookings.')}
        >
          <Text style={styles.menuButtonText}>🗓️ Availability</Text>
          <Text style={styles.menuButtonSubtext}>Manage your schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => Alert.alert('Reviews', 'View customer reviews and ratings.')}
        >
          <Text style={styles.menuButtonText}>⭐ Reviews</Text>
          <Text style={styles.menuButtonSubtext}>Customer feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={[styles.menuButtonText, styles.logoutText]}>🚪 Logout</Text>
          <Text style={styles.menuButtonSubtext}>Sign out of your account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );



  const renderProfile = () => {
    if (isLoading) {
      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentView('dashboard')}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Profile</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </View>
      );
    }
    
    return (
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentView('dashboard')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {profileData.firstName ? profileData.firstName.charAt(0) : ''}{profileData.lastName ? profileData.lastName.charAt(0) : ''}
            </Text>
          </View>
          <View style={styles.profileHeaderText}>
            <Text style={styles.profileName}>
              {profileData.firstName} {profileData.lastName}
            </Text>
            <Text style={styles.profileEmail}>{profileData.email}</Text>
          </View>
        </View>

        {/* Profile Actions */}
        <View style={styles.profileActions}>
          {!isEditingProfile ? (
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Text style={styles.saveButtonText}>💾 Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <Text style={styles.cancelButtonText}>❌ Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            {isEditingProfile ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.firstName}
                onChangeText={(text) => setEditedProfile({...editedProfile, firstName: text})}
                placeholder="First Name"
              />
            ) : (
              <Text style={styles.inputValue}>{profileData.firstName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            {isEditingProfile ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.lastName}
                onChangeText={(text) => setEditedProfile({...editedProfile, lastName: text})}
                placeholder="Last Name"
              />
            ) : (
              <Text style={styles.inputValue}>{profileData.lastName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            {isEditingProfile ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.email}
                onChangeText={(text) => setEditedProfile({...editedProfile, email: text})}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.inputValue}>{profileData.email}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            {isEditingProfile ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.phone}
                onChangeText={(text) => setEditedProfile({...editedProfile, phone: text})}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.inputValue}>{profileData.phone}</Text>
            )}
          </View>
        </View>

        {/* Address Information */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Address Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Street Address</Text>
            {isEditingProfile ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.address}
                onChangeText={(text) => setEditedProfile({...editedProfile, address: text})}
                placeholder="Street Address"
              />
            ) : (
              <Text style={styles.inputValue}>{profileData.address}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Apartment/Unit (Optional)</Text>
            {isEditingProfile ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.address2}
                onChangeText={(text) => setEditedProfile({...editedProfile, address2: text})}
                placeholder="Apartment, suite, etc."
              />
            ) : (
              <Text style={styles.inputValue}>{profileData.address2 || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.inputLabel}>City</Text>
              {isEditingProfile ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.city}
                  onChangeText={(text) => setEditedProfile({...editedProfile, city: text})}
                  placeholder="City"
                />
              ) : (
                <Text style={styles.inputValue}>{profileData.city}</Text>
              )}
            </View>

            <View style={styles.inputGroupQuarter}>
              <Text style={styles.inputLabel}>State</Text>
              {isEditingProfile ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.state}
                  onChangeText={(text) => setEditedProfile({...editedProfile, state: text})}
                  placeholder="State"
                  maxLength={2}
                  autoCapitalize="characters"
                />
              ) : (
                <Text style={styles.inputValue}>{profileData.state}</Text>
              )}
            </View>

            <View style={styles.inputGroupQuarter}>
              <Text style={styles.inputLabel}>ZIP Code</Text>
              {isEditingProfile ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.zipCode}
                  onChangeText={(text) => setEditedProfile({...editedProfile, zipCode: text})}
                  placeholder="ZIP"
                  keyboardType="numeric"
                  maxLength={5}
                />
              ) : (
                <Text style={styles.inputValue}>{profileData.zipCode}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Cuisine Specialties */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Cuisine Specialties</Text>
          <Text style={styles.sectionSubtitle}>Select the cuisines you specialize in (customers will use this to find you)</Text>
          
          <View style={styles.cuisineContainer}>
            {cuisineTypes.map((cuisine) => {
              const isSelected = isEditingProfile ? editedCuisines.includes(cuisine) : selectedCuisines.includes(cuisine);
              return (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.cuisineTag,
                    isSelected && styles.cuisineTagSelected,
                    !isEditingProfile && styles.cuisineTagDisabled
                  ]}
                  onPress={() => isEditingProfile && toggleCuisine(cuisine)}
                  disabled={!isEditingProfile}
                >
                  <Text style={[
                    styles.cuisineTagText,
                    isSelected && styles.cuisineTagTextSelected
                  ]}>
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {selectedCuisines.length === 0 && !isEditingProfile && (
            <Text style={styles.noCuisinesText}>No cuisine specialties selected yet. Edit your profile to add them.</Text>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => {
              console.log('Opening password modal');
              setShowPasswordModal(true);
            }}
          >
            <Text style={styles.actionButtonText}>🔒 Change Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>🔔 Notification Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>🚪 Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Password Change Modal */}
      {console.log('Modal showPasswordModal state:', showPasswordModal)}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password - Chef</Text>
            
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your current password"
              secureTextEntry={true}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
            />
            
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your new password"
              secureTextEntry={true}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
            />
            
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Re-enter your new password"
              secureTextEntry={true}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <Text style={styles.saveButtonText}>
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      </ScrollView>
    );
  };

  if (currentView === 'landing') {
    return <LandingPage />;
  }

  if (currentView === 'profile') {
    return renderProfile();
  }

  return renderDashboard();
}

export default function ChefPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoggedIn(false);
    }
  };

  if (!isLoggedIn) {
    return <LandingPage />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ChefDashboardContent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fefce8', // soft cream base
  },
  container: {
    flex: 1,
    backgroundColor: '#fefce8', // soft cream base
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#3f3f1f', // earthy dark olive
    textTransform: 'capitalize',
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff', // white for visibility
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#d9f99d', // light olive highlight border
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4d7c0f', // rich olive text
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fefce8', // soft cream base
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3f3f1f', // earthy dark olive
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 16,
    color: '#78716c', // warm gray
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 14,
    color: '#4d7c0f', // rich olive text
    fontWeight: '600',
  },
  menuContainer: {
    gap: 24, // increased spacing between boxes
    paddingHorizontal: 4,
  },
  menuButton: {
    backgroundColor: '#ffffff', // white for visibility
    paddingVertical: 24, // increased vertical padding
    paddingHorizontal: 20, // increased horizontal padding
    borderRadius: 20, // slightly more rounded
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'column',
    marginBottom: 8, // additional bottom margin
    borderWidth: 1,
    borderColor: '#d9f99d', // light olive highlight border
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3f3f1f',
    marginBottom: 6,
  },
  menuButtonSubtext: {
    fontSize: 14,
    color: '#6b7280', // neutral slate
  },
  logoutButton: {
    borderColor: '#ef4444', // red border for logout
  },
  logoutText: {
    color: '#ef4444', // red text for logout
  },
  // Profile styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fefce8',
  },
  backButton: {
    paddingRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4d7c0f',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  profileContainer: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeaderText: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3f3f1f',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
  },
  profileActions: {
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#4d7c0f',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#d9f99d', // light olive highlight
    paddingVertical: 16, // increased padding
    paddingHorizontal: 20,
    borderRadius: 20, // increased border radius
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4d7c0f', // rich olive text
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cancelButtonText: {
    color: '#4d7c0f', // rich olive text
    fontSize: 16,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3f3f1f',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 5,
  },
  inputValue: {
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textInput: {
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroupHalf: {
    flex: 1,
  },
  inputGroupQuarter: {
    flex: 0.5,
  },
  actionButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  logoutButtonText: {
    color: '#dc2626',
  },
  // Cuisine specialty styles
  cuisineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  cuisineTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 8,
  },
  cuisineTagSelected: {
    backgroundColor: '#4d7c0f',
    borderColor: '#4d7c0f',
  },
  cuisineTagDisabled: {
    opacity: 1,
  },
  cuisineTagText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  cuisineTagTextSelected: {
    color: '#ffffff',
  },
  noCuisinesText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Booking requests styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
  },
  statusAccepted: {
    backgroundColor: '#D4EDDA',
  },
  statusDeclined: {
    backgroundColor: '#F8D7DA',
  },
  statusCompleted: {
    backgroundColor: '#D1ECF1',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingDetails: {
    marginBottom: 15,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  bookingInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  notesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 5,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  bookingActions: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  requestedAt: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  acceptButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    flex: 0.4,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  declineButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    flex: 0.4,
  },
  declineButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#3f3f1f',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3f3f1f',
    marginBottom: 8,
    marginTop: 12,
  },
});