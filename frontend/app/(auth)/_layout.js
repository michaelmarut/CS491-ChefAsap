import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../context/AuthContext';

import { View } from 'react-native';
import LoadingIcon from '../components/LoadingIcon';

export default function AuthLayout() {
    const { isAuthenticated, isLoading, userType } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!isLoading && isAuthenticated && router) router.replace(userType === 'customer' ? '/(tabs)/SearchScreen' : '/(tabs)/BookingsScreen');
    }, [isLoading, isAuthenticated]);

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

    if (isLoading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 justify-center items-center bg-base-100 dark:bg-base-dark-100">

                </View>
            </>
        );
    }
    
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