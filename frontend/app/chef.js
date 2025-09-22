import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BookingPage from './booking';

export default function ChefPage() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderDashboard = () => (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>Chef Dashboard</Text>

    <View style={styles.menuContainer}>
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => setCurrentView('bookings')}
        activeOpacity={0.85}
      >
        <View style={styles.menuButtonHeader}>
          <View style={[styles.iconBubble, { backgroundColor: '#e9d5ff' }]}>
            <Text style={styles.iconText}>📋</Text>
          </View>
          <Text style={styles.menuButtonText}>My Bookings</Text>
        </View>
        <Text style={styles.menuButtonSubtext}>View your booking history</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => setCurrentView('reviews')}
        activeOpacity={0.85}
      >
        <View style={styles.menuButtonHeader}>
          <View style={[styles.iconBubble, { backgroundColor: '#fde68a' }]}>
            <Text style={styles.iconText}>📅</Text>
          </View>
          <Text style={styles.menuButtonText}>Reviews</Text>
        </View>
        <Text style={styles.menuButtonSubtext}>Rate your clients</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => setCurrentView('profile')}
        activeOpacity={0.85}
      >
        <View style={styles.menuButtonHeader}>
          <View style={[styles.iconBubble, { backgroundColor: '#bfdbfe' }]}>
            <Text style={styles.iconText}>👤</Text>
          </View>
          <Text style={styles.menuButtonText}>Profile</Text>
        </View>
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

  const renderReviews = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentView('dashboard')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reviews</Text>
      </View>
      <Text style={styles.comingSoon}>Reviews coming soon...</Text>
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
    case 'reviews':
      return renderReviews();
    case 'profile':
      return renderProfile();
    default:
      return renderDashboard();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefce8', // soft cream base
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#3f3f1f', // earthy dark olive
    fontFamily: 'System',
    textTransform: 'capitalize',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#d9f99d', // light olive highlight
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4d7c0f', // rich olive text
    fontWeight: '600',
  },
  menuContainer: {
    gap: 18,
  },
  menuButton: {
    backgroundColor: '#fffbea', // lighter cream for cards
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    flexDirection: 'column',
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
  comingSoon: {
    fontSize: 16,
    color: '#78716c', // warm gray
    textAlign: 'center',
    marginTop: 50,
  },
  iconBubble: {
    backgroundColor: '#bef264', // olive accent
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 18,
  },
});