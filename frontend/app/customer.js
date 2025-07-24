import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import BookingPage from './booking';

export default function CustomerPage() {
  const [currentView, setCurrentView] = useState('dashboard');

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

  const renderProfile = () => (
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
      <Text style={styles.comingSoon}>Profile management coming soon...</Text>
    </View>
  );

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
});