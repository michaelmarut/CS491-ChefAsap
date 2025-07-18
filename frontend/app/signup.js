import React, { useState } from 'react';
import { Link } from 'expo-router';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
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
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('customer');
  const [passwordRequirements, setPasswordRequirements] = useState([]);

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
          email,
          password,
          user_type: userType,
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

      showAlert('Success', 'Account created successfully!');
      console.log('Token:', data.token);
    } catch (error) {
      console.error('Error in handleSignup:', error);
      showAlert('Error', 'Network error: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
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

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setPasswordRequirements(validatePassword(text));
        }}
        secureTextEntry
      />

      {/* Password Requirements */}
      <View>
        {passwordRequirements.map((req, index) => (
          <Text key={index} style={req.met ? styles.reqMet : styles.reqUnmet}>
            {req.met ? '✓' : '○'} {req.message}
          </Text>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.userTypeButton,
            userType === 'customer' && styles.userTypeButtonSelected
          ]}
          onPress={() => setUserType('customer')}
        >
          <Text style={styles.userTypeText}>Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.userTypeButton,
            userType === 'chef' && styles.userTypeButtonSelected
          ]}
          onPress={() => setUserType('chef')}
        >
          <Text style={styles.userTypeText}>Chef</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>Sign Up</Text>
      </TouchableOpacity>

      <Link href="/" asChild>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFF9C4',
    flex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 10,
    fontSize: 16,
  },

  errorText: {
    color: 'red',
    marginBottom: 5,
    marginLeft: 10,
  },

  reqMet: {
    color: 'green',
    marginLeft: 10,
  },

  reqUnmet: {
    color: 'gray',
    marginLeft: 10,
  },

  buttonRow: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'center',
  },

  buttonSpacer: {
    width: 10,
    },
    userTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginHorizontal: 5,
  },

  userTypeButtonSelected: {
    backgroundColor: '#FFD54F', 
  },

  signupButton: {
  backgroundColor: '#8000ff', // purple
  paddingVertical: 14,
  borderRadius: 25,
  marginTop: 10,
  alignItems: 'center',
  },

  signupButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  userTypeText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },

  backButton: {
  marginTop: 20,
  alignSelf: 'center',
  paddingVertical: 8,
  paddingHorizontal: 16,
  backgroundColor: '#eee',
  borderRadius: 20,
  },
  
  backButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },

});
