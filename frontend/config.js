import { Platform } from "react-native";

export default function getEnvVars() {

  if (process.env.EXPO_PUBLIC_API_URL) {
    return { apiUrl: process.env.EXPO_PUBLIC_API_URL };
  }


  return {
    apiUrl: "http://192.168.1.181:3000", // need to match with flask api link
  };
}
