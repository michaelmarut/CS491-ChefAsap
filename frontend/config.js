import Constants from 'expo-constants';

// was causing 'ERROR  Connection error: Network request failed' on my computer
/*
const getApiUrl = () => {
  // 🔧 临时修复：直接使用后端 IP
  // 后端运行在: 192.168.1.181:3000
  const backendIP = 'http://192.168.1.181:3000';
  
  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    // If running in Expo Go or a dev build
    const ipAddress = hostUri.split(':')[0];
    const url = `http://${ipAddress}:3000`;
    console.log('Auto-detected URL:', url);
    console.log('Backend IP:', backendIP);
    
    // 使用后端 IP（因为自动检测可能不准确）
    return backendIP;
  } else {
    // Fallback for web or other environments
    console.log('Using backend IP:', backendIP);
    return backendIP;
  }
};
*/

const getApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    const ipAddress = hostUri.split(':')[0];
    const url = `http://${ipAddress}:3000`;
    return url;
  } else {
    const url = 'http://localhost:3000';
    return url;
  }
};

export default function getEnvVars() {
  const config = {
    apiUrl: getApiUrl()
  };
  //console.log('Final Config:', config);
  return config;
}
