import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
    return (
        <>
            <StatusBar style="dark" />
            <Stack options={{ headerShown: false }}>
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
        </>
    );
}