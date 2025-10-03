import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import BookingPage from './BookingScreen';
import ProfilePage from './ProfilePage';

export default function CustomerPage() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderDashboard = () => (
    <ScrollView className="flex-1 bg-base-100 p-5">
      <Text className="text-2xl font-bold text-center mb-4 text-olive-500 capitalize mt-8">Customer Dashboard</Text>

      <View className="gap-y-4"> 
        <TouchableOpacity
          className="bg-base-100 py-5 px-4 rounded-2xl shadow-md shadow-black"
          onPress={() => setCurrentView('booking')}
          activeOpacity={0.85}
        >
          <View> 
            <View
              className="w-9 h-9 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: '#fde68a' }}
            >
              <Text className="text-xl">📅</Text>
            </View>
            <Text className="text-xl font-bold text-olive-500 mb-1.5">Book a Chef</Text>
          </View>
          <Text className="text-sm text-base-200">Find and book chefs in your area</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-base-100 py-5 px-4 rounded-2xl shadow-md shadow-black"
          onPress={() => setCurrentView('bookings')}
          activeOpacity={0.85}
        >
          <View>
            <View
              className="w-9 h-9 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: '#e9d5ff' }}
            >
              <Text className="text-xl">📋</Text>
            </View>
            <Text className="text-xl font-bold text-olive-500 mb-1.5">My Bookings</Text>
          </View>
          <Text className="text-sm text-base-200">View your booking history</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-base-100 py-5 px-4 rounded-2xl shadow-md shadow-black"
          onPress={() => setCurrentView('profile')}
          activeOpacity={0.85}
        >
          <View>
            <View
              className="w-9 h-9 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: '#bfdbfe' }}
            >
              <Text className="text-xl">👤</Text>
            </View>
            <Text className="text-xl font-bold text-olive-500 mb-1.5">Profile</Text>
          </View>
          <Text className="text-sm text-base-200">Manage your account settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderBackableView = (title, content) => (
    <View className="flex-1 bg-base-100 p-5">
      <View className="flex-row items-center mb-5">
        <TouchableOpacity
          className="py-2 px-4 bg-olive-100 rounded-xl self-start mr-2.5 mb-2.5 shadow-sm shadow-black/10"
          onPress={() => setCurrentView('dashboard')}
        >
          <Text className="text-base text-olive-400 font-semibold">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-olive-500 capitalize">{title}</Text>
      </View>
      {content}
    </View>
  );

  const renderBookings = () => renderBackableView('My Bookings',
    <Text className="text-base text-warm-gray text-center mt-12">Booking history coming soon...</Text>
  );

  const renderProfile = () => renderBackableView('Profile', <ProfilePage />);

  const renderBooking = () => (
    <View className="flex-1 bg-base-100 p-5">
      <View className="flex-row items-center mb-5">
        <TouchableOpacity
          className="py-2 px-4 bg-olive-100 rounded-xl self-start mr-2.5 mb-2.5 shadow-sm shadow-black/10"
          onPress={() => setCurrentView('dashboard')}
        >
          <Text className="text-base text-olive-400 font-semibold">← Back</Text>
        </TouchableOpacity>
      </View>
      <BookingPage />
    </View>
  );

  switch (currentView) {
    case 'booking':
      return renderBooking();
    case 'bookings':
      return renderBookings();
    case 'profile':
      return renderProfile();
    default:
      return renderDashboard();
  }
}