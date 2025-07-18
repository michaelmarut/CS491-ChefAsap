import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
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
    <View style={{ padding: 20 }}>
      <Text>Sign Up</Text>
      
      <TextInput
        style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
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
      {emailError ? <Text style={{ color: 'red' }}>{emailError}</Text> : null}

      <TextInput
        style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
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
          <Text key={index} style={{ color: req.met ? 'green' : 'gray' }}>
            {req.met ? '✓' : '○'} {req.message}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', marginVertical: 10 }}>
        <Button
          title="Customer"
          onPress={() => setUserType('customer')}
          color={userType === 'customer' ? 'blue' : 'gray'}
        />
        <View style={{ width: 10 }} />
        <Button
          title="Chef"
          onPress={() => setUserType('chef')}
          color={userType === 'chef' ? 'blue' : 'gray'}
        />
      </View>

      <Button title="Sign Up" onPress={handleSignup} />
    </View>
  );
}


