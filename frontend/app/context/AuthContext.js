import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';


export const AuthContext = createContext({
    isAuthenticated: false,
    userType: null,
    token: null,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userType, setUserType] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadSession = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('auth_token');
                const storedUserType = await AsyncStorage.getItem('user_type');

                if (storedToken && storedUserType) {
                    setToken(storedToken);
                    setUserType(storedUserType);
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

    const login = async (newToken, newUserType) => {
        try {
            await SecureStore.setItemAsync('auth_token', newToken);
            await AsyncStorage.setItem('user_type', newUserType);

            setToken(newToken);
            setUserType(newUserType);
            setIsAuthenticated(true);

        } catch (e) {
            console.error('Failed to save login data:', e);
        }
    };

    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync('auth_token');
            await AsyncStorage.removeItem('user_type');

            setToken(null);
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
