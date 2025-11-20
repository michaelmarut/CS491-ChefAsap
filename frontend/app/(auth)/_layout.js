import { Stack } from 'expo-router';
import { useTheme } from '../providers/ThemeProvider';
import { useEffect } from 'react';

export default function AuthLayout() {
    const { setIsOnAuthPage } = useTheme();
    const handleMount = () => {
        setIsOnAuthPage(true);
    };

    const handleUnmount = () => {
        setIsOnAuthPage(false);
    };

    useEffect(() => {
        handleMount();

        return handleUnmount;
    }, []);    
    
    return (
        <Stack options={{ headerShown: false }} >
            <Stack.Screen
                name="index"
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="SignInScreen"
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="SignUpScreen"
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="ForgetPasswordScreen"
                options={{ headerShown: false }}
            />
        </Stack>
    );
}