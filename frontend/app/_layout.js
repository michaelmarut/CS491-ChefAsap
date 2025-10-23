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
        return <LoadingIcon />;
    }

    return (
        <View style={{ flex: 1 }}>
            <Stack>
                {!isAuthenticated ? (
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                ) : (
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                )}
            </Stack>
        </View>
    );
}