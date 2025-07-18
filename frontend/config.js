import Constants from 'expo-constants';

const getApiUrl = () => {
  // Using fixed IP address
  const url = 'your_ip_address';
  console.log('Using URL:', url);
  return url;
};

export default function getEnvVars() {
  const config = {
    apiUrl: getApiUrl()
  };
  console.log('Config:', config); // Debug log
  return config;
}
