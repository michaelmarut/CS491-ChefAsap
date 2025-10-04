import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';


export const AuthContext = createContext({
    isAuthenticated: false,
    userType: null,
    userId: null,
    profileId: null,
    token: null,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userType, setUserType] = useState(null);
    const [userId, setUserId] = useState(null);
    const [profileId, setProfileId] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadSession = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('auth_token');
                const storedUserType = await AsyncStorage.getItem('user_type');
                const storedUserId = await AsyncStorage.getItem('user_id');
                const storedProfileId = await AsyncStorage.getItem('profile_id');

                if (storedToken && storedUserType && storedUserId && storedProfileId) {
                    setToken(storedToken);
                    setUserType(storedUserType);
                    setUserId(storedUserId);
                    setProfileId(storedProfileId);
                    setIsAuthenticated(true);
                }
            } catch (e) {
                console.error('Failed to load session:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadSession();
    }, []);

    const login = async (newToken, newUserType, newUserId, newProfileId) => {
        try {
            await SecureStore.setItemAsync('auth_token', newToken);
            await AsyncStorage.setItem('user_type', newUserType);
            await AsyncStorage.setItem('user_id', String(newUserId));
            await AsyncStorage.setItem('profile_id', String(newProfileId));

            setToken(newToken);
            setUserType(newUserType);
            setUserId(newUserId);
            setProfileId(newProfileId);
            setIsAuthenticated(true);

        } catch (e) {
            console.error('Failed to save login data:', e);
        }
    };


    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync('auth_token');
            await AsyncStorage.removeItem('user_type');
            await AsyncStorage.removeItem('user_id');
            await AsyncStorage.removeItem('profile_id');

            setToken(null);
            setUserId(null);
            setProfileId(null);
            setUserType(null);
            setIsAuthenticated(false);

            router.replace('/(auth)');

        } catch (e) {
            console.error('Failed to clear logout data:', e);
        }
    };


    const contextValue = {
        isAuthenticated,
        userType,
        userId,
        profileId,
        token,
        login,
        logout,
        isLoading,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
