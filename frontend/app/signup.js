import { Picker } from "@react-native-picker/picker";
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, ToastAndroid } from 'react-native';
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
        },
      },
    ];

    Alert.alert(title, message, buttons, { cancelable: false });
  };

  // AFTER:
  const tryFetch = async (payload) => {
    try {
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return { response, error: null };
    } catch (error) {
      return { response: null, error };
    }
  };

      const handleSignup = async () => {
        setEmailError('');

        const normalizedEmail = email.trim().toLowerCase();

        // Validation checks
        const allRequirementsMet = passwordRequirements.every(req => req.met);
        if (!allRequirementsMet) {
          showAlert('Error', 'Please meet all password requirements');
          return;
        }
        if (password !== confirmPassword) {
          showAlert('Error', 'Passwords do not match');
          return;
        }
        if (
          !firstName.trim() ||
          !lastName.trim() ||
          !phone.trim() ||
          !address.trim() ||
          !city.trim() ||
          !state.trim() ||
          !zip.trim()
        ) {
          showAlert('Error', 'Please fill in all required fields');
          return;
        }
        if (!validateEmail(normalizedEmail)) {
          setEmailError('Please enter a valid email address');
          return;
        }

        const payload = {
          firstName,
          lastName,
          email: normalizedEmail,
          password,
          user_type: userType,
          phone,
          address,
          address2,
          city,
          state,
          zip,
        };

        try {
          console.log('Trying to connect to:', apiUrl);
          const result = await tryFetch(payload);

          if (!result.response) {
            const errorMsg = result.error?.message || 'Unknown error';
            console.error('Connection error:', errorMsg);
            showAlert('Error', `Could not connect to server: ${errorMsg}`);
            return;
          }

          const { response } = result;
          const data = await response.json().catch(() => ({}));
          console.log('Signup status:', response.status, 'data:', data);

          if (!response.ok) {
            // handle duplicate email nicely
            const msg = (data?.error || '').toLowerCase();
            if (
              response.status === 409 ||
              msg.includes('exists') ||
              msg.includes('taken') ||
              msg.includes('used')
            ) {
              setEmailError('This email is already registered');
              showAlert('Error', 'This email is already registered');
            } else {
              showAlert('Error', data.error || 'Signup failed');
            }
            return;
          }
          
          // ✅ Show a success message & redirect automatically
          if (Platform.OS === 'android') {
            ToastAndroid.show('Account created! Redirecting to login…', ToastAndroid.SHORT);
          } else {
            console.log('Account created! Redirecting to login…');
          }

          setTimeout(() => {
            router.replace('/'); // or '/login' if that is your login page
          }, 1200);



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
            setEmailError(''); // <-- clear any prior “already registered” error immediately
            if (text.length > 0 && !validateEmail(text.trim().toLowerCase())) {
              setEmailError('Please enter a valid email address');
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
                  {/* STATE */}
                  <View style={styles.stateContainer}>
                    <Text style={styles.fieldLabel}>State</Text>
                      <View
                          style={[
                            styles.input,
                            styles.stateInput,
                            {
                              padding: 0,
                              height: 40,
                              justifyContent: 'center',
                            },
                          ]}
                        >
                          <Picker
                            selectedValue={state}
                            onValueChange={(val) => setState(val)}
                            // 'mode' is Android-only; keep 'dialog' to avoid dropdown clipping there
                            mode={Platform.OS === 'android' ? 'dialog' : undefined}
                            // iOS: use itemStyle to control wheel text size/line height
                            itemStyle={{ fontSize: 16 }}
                            style={{ width: '100%' }} // color doesn't affect iOS wheel; that's normal
                          >
                            {US_STATES.map(({ label, value }) => (
                              <Picker.Item key={value || label} label={label} value={value} />
                            ))}
                          </Picker>
                        </View>
                      </View>

                {/* ZIP */}
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
      
      {/*Create Account and Back Button */}
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
    backgroundColor: '#fefce8', // soft cream base (olive theme)
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#3f3f1f', // earthy dark olive
    textTransform: 'capitalize',
  },

  section: {
    backgroundColor: '#fffbea', // lighter cream for cards (olive theme)
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
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
    color: '#4d7c0f', // rich olive text
  },

  input: {
    borderWidth: 1,
    borderColor: '#d9f99d', // light olive highlight
    backgroundColor: '#ffffff', // white for visibility
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 8,
    fontSize: 16,
    color: '#3f3f1f', // earthy dark olive
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
    padding: 12,
    backgroundColor: '#d9f99d', // light olive highlight
    borderRadius: 10,
  },

  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    color: '#4d7c0f', // rich olive text
  },

  reqMet: {
    color: '#4d7c0f', // rich olive text
    fontSize: 12,
    marginBottom: 2,
  },

  reqUnmet: {
    color: '#78716c', // warm gray
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
    backgroundColor: '#d9f99d', // light olive highlight
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bef264', // olive accent
  },

  userTypeButtonSelected: {
    backgroundColor: '#bef264', // olive accent
    borderColor: '#4d7c0f', // rich olive text
  },

  userTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4d7c0f', // rich olive text
    marginBottom: 3,
  },

  userTypeTextSelected: {
    color: '#3f3f1f', // earthy dark olive
  },

  userTypeDescription: {
    fontSize: 10,
    textAlign: 'center',
    color: '#78716c', // warm gray
  },

  signupButton: {
    backgroundColor: '#4d7c0f', // rich olive text
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  signupButtonText: {
    color: '#fefce8', // soft cream base
    fontWeight: '700',
    fontSize: 16,
  },

  backButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#d9f99d', // light olive highlight
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#bef264', // olive accent
  },

  backButtonText: {
    color: '#4d7c0f', // rich olive text
    fontWeight: '600',
    fontSize: 14,
  },

});
