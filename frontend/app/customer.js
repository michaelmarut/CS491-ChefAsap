import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Modal, SafeAreaView } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';
import BookingPage from './booking';
import LandingPage from './index';
import getEnvVars from '../config';

function CustomerPageContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
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
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  
  const { apiUrl } = getEnvVars();
  const { confirmSetupIntent } = useStripe();

  const renderDashboard = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Customer Dashboard</Text>
      
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setCurrentView('booking')}
        >
          <Text style={styles.menuButtonText}>📅 Book a Chef</Text>
          <Text style={styles.menuButtonSubtext}>Find and book chefs in your area</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setCurrentView('bookings')}
        >
          <Text style={styles.menuButtonText}>📋 My Bookings</Text>
          <Text style={styles.menuButtonSubtext}>View your booking history</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setCurrentView('profile')}
        >
          <Text style={styles.menuButtonText}>👤 Profile</Text>
          <Text style={styles.menuButtonSubtext}>Manage your account settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderBookings = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentView('dashboard')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Bookings</Text>
      </View>
      <Text style={styles.comingSoon}>Booking history coming soon...</Text>
    </View>
  );

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
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data: ' + error.message);
      setIsLoading(false);
    }
  };
  
  // Load profile data when component mounts
  useEffect(() => {
    fetchProfileData();
  }, []);
  
  // Fetch payment methods from backend
  const fetchPaymentMethods = async () => {
    try {
      setIsLoadingPayments(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch(`${apiUrl}/payments/payment-methods`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPaymentMethods(data.payment_methods || []);
      } else {
        console.error('Error fetching payment methods:', data.error);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };
  
  // Add new payment method
  const handleAddPaymentMethod = async () => {
    try {
      setIsLoadingPayments(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      
      // Create setup intent
      const response = await fetch(`${apiUrl}/payments/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create setup intent');
      }
      
      // Confirm setup intent with Stripe
      const { setupIntent, error } = await confirmSetupIntent(data.client_secret, {
        paymentMethodType: 'Card',
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (setupIntent.status === 'Succeeded') {
        Alert.alert('Success', 'Payment method added successfully!');
        setShowAddCard(false);
        fetchPaymentMethods(); // Refresh payment methods
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', 'Failed to add payment method: ' + error.message);
    } finally {
      setIsLoadingPayments(false);
    }
  };
  
  // Delete payment method
  const handleDeletePaymentMethod = async (paymentMethodId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch(`${apiUrl}/payments/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Payment method deleted successfully!');
        fetchPaymentMethods(); // Refresh payment methods
      } else {
        throw new Error(data.error || 'Failed to delete payment method');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      Alert.alert('Error', 'Failed to delete payment method: ' + error.message);
    }
  };

  const handleEditProfile = () => {
    setEditedProfile({...profileData});
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      // Here you would typically make an API call to save the profile
      // For now, we'll just update locally and show success
      setProfileData({...editedProfile});
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully!');
      
      // TODO: Implement backend API call to save profile changes
      // const response = await fetch(`${apiUrl}/auth/profile`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${authToken}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(editedProfile),
      // });
      
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile({...profileData});
    setIsEditingProfile(false);
  };

  const handleLogout = async () => {
    try {
      // Show confirmation first
      Alert.alert(
        'Logout', 
        'Are you sure you want to log out?', 
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: async () => {
              // Clear stored authentication data
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userType');
              
              // Set logged in state to false to trigger navigation
              setIsLoggedIn(false);
              
              console.log('User logged out successfully');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'There was an issue logging out. Please try again.');
    }
  };

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

        {/* Account Actions */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>🔒 Change Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setShowPaymentMethods(true);
              fetchPaymentMethods();
            }}
          >
            <Text style={styles.actionButtonText}>💳 Payment Methods</Text>
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
      
      {/* Payment Methods Modal */}
      <Modal
        visible={showPaymentMethods}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowPaymentMethods(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Payment Methods</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                Alert.alert(
                  'Add Payment Method',
                  'Demo: This would open the card input form. Add your Stripe keys to enable full payment functionality.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'OK', 
                      onPress: () => {
                        // For now, just simulate adding a demo card
                        Alert.alert('Success!', 'Demo payment method added successfully!');
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {isLoadingPayments ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading payment methods...</Text>
              </View>
            ) : paymentMethods.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No payment methods added yet</Text>
                <Text style={styles.emptySubtext}>Add a card to get started</Text>
              </View>
            ) : (
              paymentMethods.map((method) => (
                <View key={method.id} style={styles.paymentMethodCard}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardBrand}>{method.brand.toUpperCase()}</Text>
                    <Text style={styles.cardNumber}>•••• •••• •••• {method.last4}</Text>
                    <Text style={styles.cardExpiry}>Expires {method.exp_month}/{method.exp_year}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => {
                      Alert.alert(
                        'Delete Payment Method',
                        'Are you sure you want to delete this payment method?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Delete', 
                            style: 'destructive',
                            onPress: () => handleDeletePaymentMethod(method.id)
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
      

      
    </ScrollView>
    );
  };

  const renderBooking = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentView('dashboard')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
      <BookingPage />
    </View>
  );

  // If user logged out, show the landing page
  if (!isLoggedIn) {
    return <LandingPage />;
  }

  switch (currentView) {
    case 'booking':
      return renderBooking();
    case 'bookings':
      return renderBookings();
    case 'profile':
      return renderProfile();
    default:
      return renderDashboard();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  menuContainer: {
    gap: 15,
  },
  menuButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  menuButtonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  comingSoon: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  profileContainer: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileHeaderText: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
  },
  profileActions: {
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroupHalf: {
    flex: 2,
  },
  inputGroupQuarter: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  inputValue: {
    fontSize: 16,
    color: '#666',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  actionButton: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
  },
  logoutButtonText: {
    color: '#d32f2f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  modalFullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    padding: 10,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  paymentMethodCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardNumber: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  cardExpiry: {
    fontSize: 14,
    color: '#999',
  },
  deleteButton: {
    padding: 10,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  cardFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  cardField: {
    height: 50,
    marginBottom: 30,
  },
  addCardButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addCardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cardInputContainer: {
    marginBottom: 20,
  },
  cardInput: {
    fontSize: 16,
    color: '#333',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  cardInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardInputHalf: {
    flex: 1,
  },
  demoNote: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  demoNoteText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  overlayModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  addCardModalContainer: {
    backgroundColor: '#fff',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 15,
    overflow: 'hidden',
  },
});

export default function CustomerPage() {
  // For now, return the component directly without StripeProvider to avoid key issues
  // Uncomment and add your Stripe key when ready for production
  return <CustomerPageContent />;
  
  /* 
  // Uncomment this when you have your Stripe publishable key:
  return (
    <StripeProvider
      publishableKey="pk_test_your_actual_key_here" // Replace with your actual Stripe publishable key
      urlScheme="chefasap" // Your app's URL scheme
    >
      <CustomerPageContent />
    </StripeProvider>
  );
  */
}