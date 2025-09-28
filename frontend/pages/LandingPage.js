import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';

export default function LandingPage({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🍳 ChefAsap</Text>
          <Text style={styles.subtitle}>Find your perfect chef, anytime</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/images/landingPage.png')}
            style={styles.landingImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('ChefSearch')}
          >
            <Text style={styles.primaryButtonText}>🔍 Search Chefs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Booking')}
          >
            <Text style={styles.secondaryButtonText}>📅 Book a Chef</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.outlineButtonText}>🔐 Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.outlineButtonText}>✨ Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Connect with professional chefs in your area
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefce8', // soft cream background
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3f3f1f', // earthy dark olive
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  landingImage: {
    width: 250,
    height: 200,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#65a30d', // olive green
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#4d7c0f', // deeper olive
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#65a30d',
  },
  outlineButtonText: {
    color: '#65a30d',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});