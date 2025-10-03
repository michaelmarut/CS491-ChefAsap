import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack>
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

        </Stack>
    );
}