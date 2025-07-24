import Constants from 'expo-constants';

const getApiUrl = () => {
  // Using local IP address for Expo Go testing
  const url = 'your_url';
  console.log('Using URL:', url);
  return url;
};

export default function getEnvVars() {
  const config = {
    apiUrl: getApiUrl()
  };
  console.log('Config:', config);
  return config;
}
