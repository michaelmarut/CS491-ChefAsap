import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { View } from 'react-native';
import LoadingIcon from './components/LoadingIcon';
import ThemeProvider from './providers/ThemeProvider'; 

export default function RootLayout() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <RootStack />
            </ThemeProvider>
        </AuthProvider>
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
        <View style={{ flex: 1 }}>
            <Stack>
                {!isAuthenticated ? (
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                ) : (
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                )}
                <Stack.Screen name="ChefProfileScreen/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="ChefMenu/[id]" options={{ headerShown: false }} />
            </Stack>
        </View>
    );
}