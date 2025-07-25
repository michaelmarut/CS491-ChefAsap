import React, { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import getEnvVars from '../config';

const validatePassword = (password) => {
  const requirements = [
    { test: /.{8,}/, message: 'At least 8 characters' },
    { test: /[A-Z]/, message: 'At least one uppercase letter' },
    { test: /[a-z]/, message: 'At least one lowercase letter' },
    { test: /[0-9]/, message: 'At least one number' },
    { test: /[!@#$%^&*]/, message: 'At least one special character (!@#$%^&*)' }
  ];

  return requirements.map(req => ({
    message: req.message,
    met: req.test.test(password)
  }));
};

const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatchError, setPasswordMatchError] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [userType, setUserType] = useState('customer');
  const [passwordRequirements, setPasswordRequirements] = useState([]);
  const router = useRouter();

  const { apiUrl } = getEnvVars();

  const showAlert = (title, message, onPress = null) => {
    const buttons = [
      {
        text: 'OK',
        onPress: () => {
          console.log('Alert pressed:', title);
          if (onPress) onPress();
        }
      }
    ];

    Alert.alert(title, message, buttons, { cancelable: false });
  };

  const tryFetch = async () => {
    try {
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          user_type: userType,
          phone,
          address,
          address2,
          city,
          state,
          zip,
        }),
      });
      return { response, error: null };
    } catch (error) {
      return { response: null, error };
    }
  };

  const handleSignup = async () => {
    // Check if all password requirements are met
    const allRequirementsMet = passwordRequirements.every(req => req.met);
    if (!allRequirementsMet) {
      showAlert('Error', 'Please meet all password requirements');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    // Check if required fields are filled
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !address.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      showAlert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      console.log('Trying to connect to:', apiUrl);
      console.log('Attempting signup...');
      const result = await tryFetch();
      
      if (!result.response) {
        const errorMsg = result.error?.message || 'Unknown error';
        console.error('Connection error:', errorMsg);
        showAlert('Error', `Could not connect to server: ${errorMsg}`);
        return;
      }

      const response = result.response;
      console.log('Got response:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        Alert.alert('Error', data.error || 'Signup failed');
        return;
      }

      console.log('Token:', data.token);
      console.log('User type:', userType);
      
      // Navigate to appropriate dashboard based on user type
      showAlert('Success', 'Account created successfully!', () => {
        if (userType === 'customer') {
          router.push('/customer');
        } else if (userType === 'chef') {
          router.push('/chef');
        }
      });
    } catch (error) {
      console.error('Error in handleSignup:', error);
      showAlert('Error', 'Network error: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create Your Account</Text>
      
      {/* Personal Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <Text style={styles.fieldLabel}>Name</Text>
        <View style={styles.nameRow}>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
        
        <Text style={styles.fieldLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="your.email@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (text.length > 0 && !validateEmail(text)) {
              setEmailError('Please enter a valid email address');
            } else {
              setEmailError('');
            }
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        
        <Text style={styles.fieldLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="(555) 123-4567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      {/* Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create Password</Text>
        
        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a secure password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordRequirements(validatePassword(text));
            if (confirmPassword && text !== confirmPassword) {
              setPasswordMatchError('Passwords do not match');
            } else {
              setPasswordMatchError('');
            }
          }}
          secureTextEntry
        />

        <Text style={styles.fieldLabel}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (password && text !== password) {
              setPasswordMatchError('Passwords do not match');
            } else {
              setPasswordMatchError('');
            }
          }}
          secureTextEntry
        />
        {passwordMatchError ? <Text style={styles.errorText}>{passwordMatchError}</Text> : null}

        {/* Password Requirements */}
        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementsTitle}>Password must have:</Text>
          {passwordRequirements.map((req, index) => (
            <Text key={index} style={req.met ? styles.reqMet : styles.reqUnmet}>
              {req.met ? '✓' : '○'} {req.message}
            </Text>
          ))}
        </View>
      </View>

      {/* Address Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Address</Text>
        
        <Text style={styles.fieldLabel}>Street Address</Text>
        <TextInput
          style={styles.input}
          placeholder="123 Main Street"
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.fieldLabel}>Apartment, Suite, etc. (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Apt 4B, Suite 200, etc."
          value={address2}
          onChangeText={setAddress2}
        />

        <Text style={styles.fieldLabel}>City</Text>
        <TextInput
          style={styles.input}
          placeholder="City"
          value={city}
          onChangeText={setCity}
        />
        
        <View style={styles.stateZipRow}>
          <View style={styles.stateContainer}>
            <Text style={styles.fieldLabel}>State</Text>
            <TextInput
              style={[styles.input, styles.stateInput]}
              placeholder="California"
              value={state}
              onChangeText={setState}
              autoCapitalize="words"
            />
          </View>
          
          <View style={styles.zipContainer}>
            <Text style={styles.fieldLabel}>Zip Code</Text>
            <TextInput
              style={[styles.input, styles.zipInput]}
              placeholder="12345"
              value={zip}
              onChangeText={setZip}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
        </View>
      </View>

      {/* User Type Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>I am a...</Text>
        <View style={styles.userTypeRow}>
          <TouchableOpacity
            style={[
              styles.userTypeButton,
              userType === 'customer' && styles.userTypeButtonSelected
            ]}
            onPress={() => setUserType('customer')}
          >
            <Text style={[styles.userTypeText, userType === 'customer' && styles.userTypeTextSelected]}>🍽️ Customer</Text>
            <Text style={styles.userTypeDescription}>Looking for chefs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.userTypeButton,
              userType === 'chef' && styles.userTypeButtonSelected
            ]}
            onPress={() => setUserType('chef')}
          >
            <Text style={[styles.userTypeText, userType === 'chef' && styles.userTypeTextSelected]}>👨‍🍳 Chef</Text>
            <Text style={styles.userTypeDescription}>Offering services</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>Create Account</Text>
      </TouchableOpacity>

        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Home</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9C4', // Original yellow background
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },

  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 8,
    color: '#555',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 8,
    fontSize: 16,
    color: '#333',
  },

  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  nameInput: {
    flex: 1,
    marginHorizontal: 3,
  },

  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
    marginLeft: 5,
  },

  passwordRequirements: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },

  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    color: '#555',
  },

  reqMet: {
    color: 'green',
    fontSize: 12,
    marginBottom: 2,
  },

  reqUnmet: {
    color: 'gray',
    fontSize: 12,
    marginBottom: 2,
  },

  stateZipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  stateContainer: {
    flex: 2,
    marginRight: 10,
  },

  zipContainer: {
    flex: 1,
  },

  stateInput: {
    // Full width within its container
  },

  zipInput: {
    // Full width within its container
    textAlign: 'center',
  },

  userTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  userTypeButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginHorizontal: 3,
    alignItems: 'center',
  },

  userTypeButtonSelected: {
    backgroundColor: '#FFD54F', // Original yellow selection
  },

  userTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 3,
  },

  userTypeTextSelected: {
    color: '#333',
  },

  userTypeDescription: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },

  signupButton: {
    backgroundColor: '#8000ff', // Original purple
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 15,
    marginBottom: 10,
    alignItems: 'center',
  },

  signupButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  backButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#eee',
    borderRadius: 20,
    marginBottom: 10,
  },

  backButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },

});
