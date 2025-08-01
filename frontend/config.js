
const getApiUrl = () => {
  // Using local IP address for Expo Go testing
  const url = 'http://192.168.68.54:5000';
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
