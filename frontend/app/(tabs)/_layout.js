import { View} from "react-native";
import { Tabs, useGlobalSearchParams, useRouter } from 'expo-router';
import Octicons from '@expo/vector-icons/Octicons';
import { TransitionPresets } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export default function TabLayout() {
    const { isAuthenticated, userType, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/(auth)'); 
        }
    }, [isLoading, isAuthenticated, router]);

    const iconSize = 24;

    const tabBarOptions = {
        headerShown: false,
        tabBarActiveTintColor: '#D9F99D', // olive-100
        tabBarInactiveTintColor: '#3F3F1F', // olive-500
        //tabBarActiveBackgroundColor: '#BEF264', // olive-200
        //tabBarInactiveBackgroundColor: '#65A30D', // olive-300
        //tabBarShowLabels: false, //doesnt seem to do anything, should show/hide label
        tabBarHideOnKeyboard: true,
        // other options: tabBarIcon (notifications), tabBarAccessibilityLabel (accessibility (out of scope))
        tabBarStyle: {
            backgroundColor: '#65A30D', // olive-300
            //height: 100, //if height needs to be defined
        },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
        },
        screenOptions: {
            animation: 'shift', //doesnt seem to work
        },
    };

    return (
        <View className="bg-base-100 flex-1">
        <Tabs screenOptions={tabBarOptions}>

            <Tabs.Screen
                name="SearchScreen"
                options={{
                    href: userType === 'customer' ? 'SearchScreen' : null,
                    title: 'Search',
                    tabBarIcon: ({ color }) =>
                        <Octicons name="search" size={iconSize} color={color} />,
                    ...TransitionPresets.ShiftTransition,

                }}
            />

            <Tabs.Screen
                name="BookingsScreen"
                options={{
                    title: 'Bookings',
                    tabBarIcon: ({ color }) =>
                        <Octicons name="calendar" size={iconSize} color={color} />,
                    ...TransitionPresets.ShiftTransition,

                }}
            />

            <Tabs.Screen
                name="Profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) =>
                        <Octicons name="person" size={iconSize} color={color} />,
                    ...TransitionPresets.ShiftTransition,

                }}
            />
        </Tabs>
        </View>
    );
}