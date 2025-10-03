import { Picker } from "@react-native-picker/picker";
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Button from '../components/Button';
import getEnvVars from '../../config';

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

  const US_STATES = [
    { label: "Select a state...", value: "" },
    { label: "Alabama", value: "AL" },
    { label: "Alaska", value: "AK" },
    { label: "Arizona", value: "AZ" },
    { label: "Arkansas", value: "AR" },
    { label: "California", value: "CA" },
    { label: "Colorado", value: "CO" },
    { label: "Connecticut", value: "CT" },
    { label: "Delaware", value: "DE" },
    { label: "Florida", value: "FL" },
    { label: "Georgia", value: "GA" },
    { label: "Hawaii", value: "HI" },
    { label: "Idaho", value: "ID" },
    { label: "Illinois", value: "IL" },
    { label: "Indiana", value: "IN" },
    { label: "Iowa", value: "IA" },
    { label: "Kansas", value: "KS" },
    { label: "Kentucky", value: "KY" },
    { label: "Louisiana", value: "LA" },
    { label: "Maine", value: "ME" },
    { label: "Maryland", value: "MD" },
    { label: "Massachusetts", value: "MA" },
    { label: "Michigan", value: "MI" },
    { label: "Minnesota", value: "MN" },
    { label: "Mississippi", value: "MS" },
    { label: "Missouri", value: "MO" },
    { label: "Montana", value: "MT" },
    { label: "Nebraska", value: "NE" },
    { label: "Nevada", value: "NV" },
    { label: "New Hampshire", value: "NH" },
    { label: "New Jersey", value: "NJ" },
    { label: "New Mexico", value: "NM" },
    { label: "New York", value: "NY" },
    { label: "North Carolina", value: "NC" },
    { label: "North Dakota", value: "ND" },
    { label: "Ohio", value: "OH" },
    { label: "Oklahoma", value: "OK" },
    { label: "Oregon", value: "OR" },
    { label: "Pennsylvania", value: "PA" },
    { label: "Rhode Island", value: "RI" },
    { label: "South Carolina", value: "SC" },
    { label: "South Dakota", value: "SD" },
    { label: "Tennessee", value: "TN" },
    { label: "Texas", value: "TX" },
    { label: "Utah", value: "UT" },
    { label: "Vermont", value: "VT" },
    { label: "Virginia", value: "VA" },
    { label: "Washington", value: "WA" },
    { label: "West Virginia", value: "WV" },
    { label: "Wisconsin", value: "WI" },
    { label: "Wyoming", value: "WY" },
  ];

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

      showAlert('Success', 'Account created successfully!', () => {
        router.push('/SignInScreen');
      });

    } catch (error) {
      console.error('Error in handleSignup:', error);
      showAlert('Error', 'Network error: ' + error.message);
    }
  };

  return (
    <View className="flex-1 bg-base-100 rounded-xl p-4 my-2.5 shadow-md shadow-black/10">

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 30,
        }}
      >
        <Text className="text-2xl font-bold text-center mb-5 text-olive-500 capitalize">
          Create Your Account
        </Text>

        <View className="bg-white rounded-xl p-4 mb-4 shadow-md shadow-black/10">
          <Text className="text-xl font-bold mb-3 text-gray-700">Personal Information</Text>

          <Text className="text-sm font-semibold mb-1 mt-2 text-olive-400">Name</Text>
          <View className="flex-row justify-between">
            <TextInput
              className="border border-olive-100 bg-white rounded-full py-3 px-4 mb-2 text-base text-olive-500 flex-1 mx-0.5"
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              className="border border-olive-100 bg-white rounded-full py-3 px-4 mb-2 text-base text-olive-500 flex-1 mx-0.5"
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <Text className="text-sm font-semibold mb-1 mt-2 text-olive-400">Email Address</Text>
          <TextInput
            className="border border-olive-100 bg-white rounded-full py-3 px-4 mb-2 text-base text-olive-500"
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
          {emailError ? <Text className="text-red-500 text-xs mb-1 ml-1">{emailError}</Text> : null}

          <Text className="text-sm font-semibold mb-1 mt-2 text-olive-400">Phone Number</Text>
          <TextInput
            className="border border-olive-100 bg-white rounded-full py-3 px-4 mb-2 text-base text-olive-500"
            placeholder="(555) 123-4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View className="bg-white rounded-xl p-4 mb-4 shadow-md shadow-black/10">
          <Text className="text-xl font-bold mb-3 text-gray-700">Create Password</Text>

          <Text className="text-sm font-semibold mb-1 mt-2 text-olive-400">Password</Text>
          <TextInput
            className="border border-olive-100 bg-white rounded-full py-3 px-4 mb-2 text-base text-olive-500"
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

          <Text className="text-sm font-semibold mb-1 mt-2 text-olive-400">Confirm Password</Text>
          <TextInput
            className="border border-olive-100 bg-white rounded-full py-3 px-4 mb-2 text-base text-olive-500"
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
          {passwordMatchError ? <Text className="text-red-500 text-xs mb-1 ml-1">{passwordMatchError}</Text> : null}

          <View className="mt-2 p-3 bg-olive-100 rounded-xl">
            <Text className="text-sm font-semibold mb-1 text-olive-400">Password must have:</Text>
            {passwordRequirements.map((req, index) => (
              <Text
                key={index}
                className={`text-xs mb-0.5 ${req.met ? 'text-olive-400' : 'text-warm-gray'}`}
              >
                {req.met ? '✓' : '○'} {req.message}
              </Text>
            ))}
          </View>
        </View>

        <View className="bg-white rounded-xl p-4 mb-4 shadow-md shadow-black/10">
          <Text className="text-xl font-bold mb-3 text-gray-700">Your Address</Text>

          <Text className="text-sm font-semibold mb-1 mt-2 text-olive-400">Street Address</Text>
          <TextInput
            className="border border-olive-100 bg-white rounded-full py-3 px-4 mb-2 text-base text-olive-500"
            placeholder="123 Main Street"
            value={address}
            onChangeText={setAddress}
          />

          <Text className="text-sm font-semibold mb-1 mt-2 text-olive-400">Apartment, Suite, etc. (Optional)</Text>
          <TextInput
            className="border border-olive-100 bg-white rounded-full py-3 px-4 mb-2 text-base text-olive-500"
            placeholder="Apt 4B, Suite 200, etc."
            value={address2}
            onChangeText={setAddress2}
          />

          <Text className="text-sm font-semibold mb-1 mt-2 text-olive-400">City</Text>
          <TextInput
            className="border border-olive-100 bg-white rounded-full py-3 px-4 mb-2 text-base text-olive-500"
            placeholder="City"
            value={city}
            onChangeText={setCity}
          />

          <View className="flex-row justify-between">
            <View className="flex-2 mr-3">
              <Text className="text-sm font-semibold mb-1 mt-2 text-olive-400">State</Text>
              <View
                className="border border-olive-100 bg-white rounded-full py-0 mb-2"
                style={{ paddingHorizontal: 0 }}
              >
                <Picker
                  selectedValue={state}
                  onValueChange={(val) => setState(val)}
                  prompt="Select a state"
                  style={{ height: 48, color: '#3f3f1f' }}
                >
                  {US_STATES.map((s) => (
                    <Picker.Item key={s.value} label={s.label} value={s.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-sm font-semibold mb-1 mt-2 text-olive-400">Zip Code</Text>
              <TextInput
                className="border border-olive-100 bg-white rounded-full py-3 px-4 mb-2 text-base text-olive-500 text-center"
                placeholder="12345"
                value={zip}
                onChangeText={setZip}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>
        </View>

        <View className="bg-white rounded-xl p-4 mb-4 shadow-md shadow-black/10">
          <Text className="text-xl font-bold mb-3 text-gray-700">I am a...</Text>
          <View className="flex-row justify-between mt-2">

            <TouchableOpacity
              className={`flex-1 py-4 px-2 rounded-2xl mx-0.5 items-center border ${userType === 'customer'
                ? 'bg-olive-200 border-olive-400'
                : 'bg-olive-100 border-olive-200'
                }`}
              onPress={() => setUserType('customer')}
            >
              <Text
                className={`text-base font-bold text-center mb-1 ${userType === 'customer' ? 'text-olive-500' : 'text-olive-400'
                  }`}
              >
                🍽️ Customer
              </Text>
              <Text className="text-xs text-center text-warm-gray">Looking for chefs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-4 px-2 rounded-2xl mx-0.5 items-center border ${userType === 'chef'
                ? 'bg-olive-200 border-olive-400'
                : 'bg-olive-100 border-olive-200'
                }`}
              onPress={() => setUserType('chef')}
            >
              <Text
                className={`text-base font-bold text-center mb-1 ${userType === 'chef' ? 'text-olive-500' : 'text-olive-400'
                  }`}
              >
                👨‍🍳 Chef
              </Text>
              <Text className="text-xs text-center text-warm-gray">Offering services</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title="Create Account"
          style="primary"
          onPress={handleSignup}
        />

        <Button
          title="← Back"
          style="secondary"
          href="/"
        />
      </ScrollView>
    </View>
  );
}