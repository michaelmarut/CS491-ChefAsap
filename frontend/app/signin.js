import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import getEnvVars from '../config';

export default function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      const response = await fetch(`${apiUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      return { response, error: null };
    } catch (error) {
      return { response: null, error };
    }
  };

  const handleSignin = async () => {
    try {
      console.log('Trying to connect to:', apiUrl);
      console.log('Attempting signin...');
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
        Alert.alert('Error', data.error || 'Sign in failed');
        return;
      }

      showAlert('Success', 'Signed in successfully!');
      
      console.log('Token:', data.token);
      console.log('User type:', data.user_type);
    } catch (error) {
      console.error('Error in handleSignin:', error);
      showAlert('Error', 'Network error: ' + error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Sign In</Text>
      
      <TextInput
        style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Sign In" onPress={handleSignin} />
    </View>
  );
}
