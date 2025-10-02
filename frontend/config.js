import Constants from 'expo-constants';

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    // If running in Expo Go or a dev build
    const ipAddress = hostUri.split(':')[0];
    const url = `http://${ipAddress}:3000`;
    console.log('Using URL:', url);
    return url;
  } else {
    // Fallback for web or other environments
    const url = 'http://localhost:3000';
    console.log('Using URL:', url);
    return url;
  }
};

export default function getEnvVars() {
  const config = {
    apiUrl: getApiUrl()
  };
  console.log('Config:', config);
  return config;
}
