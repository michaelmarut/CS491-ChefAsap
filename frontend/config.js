import { Platform } from "react-native";

export default function getEnvVars() {

  if (process.env.EXPO_PUBLIC_API_URL) {
    return { apiUrl: process.env.EXPO_PUBLIC_API_URL };
  }


  return {
    apiUrl: "http://192.168.1.181:3000", // Backend server IP - works with emulators
    // Alternative options if above doesn't work:
    // apiUrl: "http://10.0.2.2:3000", // Android emulator localhost mapping
    // apiUrl: "http://localhost:3000", // Only works on same device/browser
  };
}
