import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { View } from 'react-native';
import LoadingIcon from './components/LoadingIcon';
import ThemeProvider from './providers/ThemeProvider'; 
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import 'react-native-reanimated';
import { enableScreens } from 'react-native-screens';

enableScreens(true);

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

    if (isLoading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100">
                    <LoadingIcon />
                </View>
            </>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}> 
            <Stack>
                {!isAuthenticated ? (
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                ) : (
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                )}
                <Stack.Screen name="ChefProfileScreen/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="ChefMenu/[id]" options={{ headerShown: false }} />
            </Stack>
        </SafeAreaView>
    );
}