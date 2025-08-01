import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import LandingPage from './index';
import getEnvVars from '../config';

function ChefDashboardContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [chefData, setChefData] = useState({
    name: 'Chef Name',
    email: 'chef@example.com',
    specialties: [],
    rating: 4.8,
    completedOrders: 127
  });

  useEffect(() => {
    fetchChefProfile();
  }, []);

  const fetchChefProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const { apiUrl } = getEnvVars();
      const response = await fetch(`${apiUrl}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChefData({
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          specialties: ['Italian', 'Mediterranean'], // This would come from backend
          rating: 4.8, // This would come from backend
          completedOrders: 127 // This would come from backend
        });
      }
    } catch (error) {
      console.error('Error fetching chef profile:', error);
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
              await AsyncStorage.removeItem('userType');
              setCurrentView('landing');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    );
  };

  const renderDashboard = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Chef Dashboard</Text>
      
      {/* Menu Options */}
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => Alert.alert('Booking Requests', 'View and manage incoming booking requests from customers.')}
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
          onPress={() => Alert.alert('Chef Profile', 'Update your chef profile, specialties, and availability.')}
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

  if (currentView === 'landing') {
    return <LandingPage />;
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
});