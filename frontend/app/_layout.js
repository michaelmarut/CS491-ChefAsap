import { Stack, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Text } from 'react-native';
import LoadingIcon from './components/LoadingIcon';

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootStack />
        </AuthProvider>
    );
}

function RootStack() {
    const { isAuthenticated, userType, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingIcon/>;
    }

    return (
        <Stack>
            {!isAuthenticated ? (
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            ) : (
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            )}
        </Stack>
    );
}