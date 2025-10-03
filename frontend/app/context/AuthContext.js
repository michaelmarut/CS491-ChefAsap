import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';


export const AuthContext = createContext({
    isAuthenticated: false,
    userType: null,
    userId: null,
    token: null,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userType, setUserType] = useState(null);
    const [userId, setUserId] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadSession = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('auth_token');
                const storedUserType = await AsyncStorage.getItem('user_type');
                const storedUserId = await AsyncStorage.getItem('user_id');

                if (storedToken && storedUserType && storedUserId) {
                    setToken(storedToken);
                    setUserType(storedUserType);
                    setUserId(storedUserId);
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

    const login = async (newToken, newUserType, newUserId) => {
        try {
            await SecureStore.setItemAsync('auth_token', newToken);
            await AsyncStorage.setItem('user_type', newUserType);
            await AsyncStorage.setItem('user_id', String(newUserId));

            setToken(newToken);
            setUserType(newUserType);
            setUserId(newUserId);
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

            setToken(null);
            setUserId(null);
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
