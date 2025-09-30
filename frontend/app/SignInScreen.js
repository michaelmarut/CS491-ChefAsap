import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import getEnvVars from '../config';

export default function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      if (data.user_type === 'customer') {
        router.push('/CustomerDashboard');
      } else if (data.user_type === 'chef') {
        router.push('/ChefDashboard');
      }
    } catch (error) {
      console.error('Error in handleSignin:', error);
      showAlert('Error', 'Network error: ' + error.message);
    }
  };

  return (
    <View className="p-5 bg-base-100 flex-1">

      <Text className="text-2xl font-bold text-center mb-5 text-olive-500 uppercase mt-8">
        Login
      </Text>

      <TextInput
        className="border border-olive-100 bg-white rounded-full py-3 px-5 my-2.5 text-base text-olive-500"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#6b7280"
      />

      <TextInput
        className="border border-olive-100 bg-white rounded-full py-3 px-5 my-2.5 text-base text-olive-500"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#6b7280"
      />

      <TouchableOpacity
        className="bg-olive-400 py-4 rounded-full mt-4 items-center shadow-md shadow-black/30 border-2 border-olive-100"
        onPress={handleSignin}
      >
        <Text className="text-base font-bold text-olive-100 ">Login</Text>
      </TouchableOpacity>

      <Link href="/" asChild>
        <TouchableOpacity
          className="mt-5 self-center py-2.5 px-5 bg-olive-100 rounded-full border-2 border-olive-400"
        >
          <Text className="text-sm font-bold text-olive-400">← Back</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}