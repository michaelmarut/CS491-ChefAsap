
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  // For development, automatically detect the local IP
  if (__DEV__) {
    // Get the local IP from Expo's debugger host
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    
    if (debuggerHost) {
      // Extract IP from debugger host (format: "192.168.1.100:19000")
      const localIP = debuggerHost.split(':')[0];
      const url = `http://${localIP}:3000`;
      console.log('Auto-detected URL:', url);
      return url;
    }
    
    // Fallback for different platforms
    if (Platform.OS === 'web') {
      const url = 'http://localhost:3000';
      console.log('Using localhost for web:', url);
      return url;
    }
    
    // Default fallback
    const url = 'http://192.168.1.100:3000';
    console.log('Using fallback URL:', url);
    return url;
  }
  
  // For production, use your production API URL
  const url = 'https://your-production-api.com';
  console.log('Using production URL:', url);
  return url;
};

export default function getEnvVars() {
  const config = {
    apiUrl: getApiUrl()
  };
  console.log('Config:', config);
  return config;
}
