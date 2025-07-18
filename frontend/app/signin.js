import React, { useState } from 'react';
import { Link } from 'expo-router';
import { useRouter } from 'expo-router';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.signupButton} onPress={handleSignin}>
        <Text style={styles.signupButtonText}>Login</Text>
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
    flex:1,
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
