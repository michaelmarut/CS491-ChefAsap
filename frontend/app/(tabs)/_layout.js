import { View } from "react-native";
import { Tabs, useGlobalSearchParams, useRouter } from 'expo-router';
import Octicons from '@expo/vector-icons/Octicons';
import { TransitionPresets } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';

export default function TabLayout() {
    const { isAuthenticated, userType, isLoading } = useAuth();
    const router = useRouter();

    const { manualTheme } = useTheme();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/(auth)');
        }
    }, [isLoading, isAuthenticated, router]);

    const iconSize = 24;

    const tabBarOptions = {
        headerShown: false,
        tabBarActiveTintColor: manualTheme === 'light' ? '#D9F99D' : "#36401F", // primary-100
        tabBarInactiveTintColor: manualTheme === 'light' ? '#3F3F1F' : "#D9F99D", // primary-500
        //tabBarActiveBackgroundColor: '#BEF264', // primary-200
        //tabBarInactiveBackgroundColor: '#65A30D', // primary-300
        //tabBarShowLabels: false, //doesnt seem to do anything, should show/hide label
        tabBarHideOnKeyboard: true,
        // other options: tabBarIcon (notifications), tabBarAccessibilityLabel (accessibility (out of scope))
        tabBarStyle: {
            backgroundColor: manualTheme === 'light' ? "#65A30D" : "#4D7C0F", // primary-300
            height: 75, //if height needs to be defined
        },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
        },
        screenOptions: {
            animation: 'shift', //doesnt seem to work
        },
    };
    
    if (userType === 'chef') return (
        <View className="bg-base-100 dark:bg-base-dark-100 flex-1">
            <Tabs screenOptions={tabBarOptions}>
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
                    name="Messages"
                    options={{
                        title: 'Messages',
                        tabBarIcon: ({ color }) =>
                            <Octicons name="comment-discussion" size={iconSize} color={color} />,
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

                <Tabs.Screen
                    name="SearchScreen"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>
        </View>
    );

    return (
        <View className="bg-base-100 dark:bg-base-dark-100 flex-1">
            <Tabs screenOptions={tabBarOptions}>

                <Tabs.Screen
                    name="SearchScreen"
                    options={{
                        href: 'SearchScreen',
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
                    name="Messages"
                    options={{
                        title: 'Messages',
                        tabBarIcon: ({ color }) =>
                            <Octicons name="comment" size={iconSize} color={color} />,
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