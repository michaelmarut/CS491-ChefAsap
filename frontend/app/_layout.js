import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { View } from 'react-native';
import LoadingIcon from './components/LoadingIcon';
import ThemeProvider from './providers/ThemeProvider'; 
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import 'react-native-reanimated';
import { enableScreens } from 'react-native-screens';

import '../global.css';

enableScreens(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <ThemeProvider>
                    <RootStack />
                </ThemeProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}

function RootStack() {
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            SplashScreen.hide();
        }
    }, [isLoading]);

    if (isLoading) {
        return null;
    }

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}> 
            <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                {/*!isAuthenticated ? (
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                ) : (
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                )*/}
                
                <Stack.Screen name="ChefProfileScreen/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="ChefMenu/[id]" options={{ headerShown: false }} />
            </Stack>
        </SafeAreaView>
    );
}