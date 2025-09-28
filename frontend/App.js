import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LandingPage from './pages/LandingPage';
import ChefSearchScreen from './app/chef-search';
import BookingPage from './app/booking';
// Temporary placeholders so navigation doesn't break
const LoginPage = () => null;
const SignupPage = () => null;

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing">
        <Stack.Screen name="Landing" component={LandingPage} />
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Signup" component={SignupPage} />
        <Stack.Screen 
          name="ChefSearch" 
          component={ChefSearchScreen} 
          options={{ title: 'Search Chefs' }} 
        />
        <Stack.Screen 
          name="Booking" 
          component={BookingPage} 
          options={{ title: 'Book a Chef' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}