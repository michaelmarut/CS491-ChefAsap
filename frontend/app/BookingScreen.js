import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import getEnvVars from '../config';

export default function BookingPage() {
  const [formData, setFormData] = useState({
    cuisine_type: '',
    meal_type: 'dinner',
    event_type: 'dinner',
    booking_date: new Date(),
    booking_time: new Date(),
    produce_supply: 'customer',
    number_of_people: '2',
    special_notes: '',
    customer_zip: ''
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [availableChefs, setAvailableChefs] = useState([]);
  const [showChefResults, setShowChefResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedChef, setSelectedChef] = useState(null);


  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);
  const [showMealTypeDropdown, setShowMealTypeDropdown] = useState(false);
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const [showProduceDropdown, setShowProduceDropdown] = useState(false);

  const { apiUrl } = getEnvVars();

  const cuisineTypes = [
    'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 'French',
    'Mediterranean', 'American', 'Caribbean', 'Korean', 'Vietnamese', 'Greek'
  ];

  const mealTypes = [
    { label: 'Breakfast', value: 'breakfast' },
    { label: 'Lunch', value: 'lunch' },
    { label: 'Dinner', value: 'dinner' }
  ];

  const eventTypes = [
    { label: 'Birthday', value: 'birthday' },
    { label: 'Wedding', value: 'wedding' },
    { label: 'Party', value: 'party' },
    { label: 'Dinner', value: 'dinner' },
    { label: 'Brunch', value: 'brunch' }
  ];

  const produceSupplyOptions = [
    { label: 'I will provide ingredients', value: 'customer' },
    { label: 'Chef provides ingredients (extra cost)', value: 'chef' }
  ];

  // Modal-based Dropdown Component
  const ModalDropdown = ({ value, options, onSelect, showModal, setShowModal, placeholder, title }) => {
    const displayValue = options.find(option =>
      typeof option === 'string' ? option === value : option.value === value
    );
    const displayText = displayValue ?
      (typeof displayValue === 'string' ? displayValue : displayValue.label) :
      placeholder;

    return (
      <>
        <TouchableOpacity
          className="border border-gray-300 rounded-lg p-3 bg-white flex-row justify-between items-center"
          onPress={() => setShowModal(true)}
        >
          <Text
            className={`text-base flex-1 ${!displayValue ? 'text-warm-gray' : 'text-olive-500'}`}
          >
            {displayText}
          </Text>
          <Text className="text-sm text-gray-600 ml-2">▼</Text>
        </TouchableOpacity>

        <Modal
          visible={showModal}
          animationType="slide"
          presentationStyle="pageSheet"
          transparent={true}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white border-t rounded-t-xl max-h-3/4">
              <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                <Text className="text-xl font-bold text-olive-500">{title}</Text>
                <TouchableOpacity
                  className="p-1"
                  onPress={() => setShowModal(false)}
                >
                  <Text className="text-2xl text-gray-600">✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="max-h-[300px]">
                {options.map((option, index) => {
                  const optionValue = typeof option === 'string' ? option : option.value;
                  const optionLabel = typeof option === 'string' ? option : option.label;
                  const isSelected = optionValue === value;

                  return (
                    <TouchableOpacity
                      key={index}
                      className={`p-4 border-b border-gray-100 flex-row justify-between items-center ${isSelected ? 'bg-olive-100' : ''}`}
                      onPress={() => {
                        onSelect(optionValue);
                        setShowModal(false);
                      }}
                    >
                      <Text
                        className={`text-base flex-1 ${isSelected ? 'text-olive-400 font-semibold' : 'text-olive-500'}`}
                      >
                        {optionLabel}
                      </Text>
                      {isSelected && <Text className="text-base text-olive-400 font-bold">✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        booking_date: selectedDate
      }));
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({
        ...prev,
        booking_time: selectedTime
      }));
    }
  };

  const validateForm = () => {
    if (!formData.cuisine_type) {
      Alert.alert('Error', 'Please select a cuisine type');
      return false;
    }
    if (!formData.customer_zip) {
      Alert.alert('Error', 'Please enter your zip code');
      return false;
    }
    if (parseInt(formData.number_of_people) < 1) {
      Alert.alert('Error', 'Number of people must be at least 1');
      return false;
    }
    if (formData.booking_date <= new Date()) {
      Alert.alert('Error', 'Please select a future date');
      return false;
    }
    return true;
  };

  const searchChefs = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const searchData = {
        cuisine_type: formData.cuisine_type,
        booking_date: formData.booking_date.toISOString().split('T')[0],
        booking_time: formData.booking_time.toTimeString().split(' ')[0].substring(0, 5),
        customer_zip: formData.customer_zip,
        number_of_people: parseInt(formData.number_of_people)
      };

      const response = await fetch(`${apiUrl}/booking/search-chefs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });

      const result = await response.json();

      if (response.ok) {
        setAvailableChefs(result.available_chefs);
        setShowChefResults(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to search for chefs');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async () => {
    try {
      const bookingData = {
        customer_id: 1,
        cuisine_type: formData.cuisine_type,
        meal_type: formData.meal_type,
        event_type: formData.event_type,
        booking_date: formData.booking_date.toISOString().split('T')[0],
        booking_time: formData.booking_time.toTimeString().split(' ')[0].substring(0, 5),
        produce_supply: formData.produce_supply,
        number_of_people: parseInt(formData.number_of_people),
        special_notes: formData.special_notes
      };

      const response = await fetch(`${apiUrl}/booking/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (response.ok) {
        return result.booking_id;
      } else {
        throw new Error(result.error || 'Failed to create booking');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      return null;
    }
  };

  const bookChef = async (chef) => {
    setLoading(true);
    try {

      const bookingId = await createBooking();
      if (!bookingId) {
        setLoading(false);
        return;
      }


      const response = await fetch(`${apiUrl}/booking/book-chef`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          chef_id: chef.chef_id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success!',
          `Your booking request has been sent to ${chef.name}. They will contact you soon!`,
          [{ text: 'OK', onPress: () => setShowChefResults(false) }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to book chef');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateTotalCost = (chef) => {
    let total = chef.estimated_total_cost;
    if (formData.produce_supply === 'chef') {
      total += chef.produce_supply_extra_cost;
    }
    return total.toFixed(2);
  };

  return (
    <ScrollView
      className="bg-base-100 rounded-xl p-5 mb-5 shadow-md shadow-black"
    >
      <Text className="text-3xl font-bold text-center mb-7 text-olive-500">Book a Chef</Text>

      {/* Cuisine Selection */}
      <View className="mb-6">
        <Text className="text-base font-semibold mb-2 text-olive-500">Cuisine Type *</Text>
        <ModalDropdown
          value={formData.cuisine_type}
          options={cuisineTypes}
          onSelect={(value) => handleInputChange('cuisine_type', value)}
          showModal={showCuisineDropdown}
          setShowModal={setShowCuisineDropdown}
          placeholder="Select Cuisine..."
          title="Choose Cuisine Type"
        />
      </View>

      {/* Meal Type */}
      <View className="mb-6">
        <Text className="text-base font-semibold mb-2 text-olive-500">Meal Type</Text>
        <ModalDropdown
          value={formData.meal_type}
          options={mealTypes}
          onSelect={(value) => handleInputChange('meal_type', value)}
          showModal={showMealTypeDropdown}
          setShowModal={setShowMealTypeDropdown}
          placeholder="Select Meal Type..."
          title="Choose Meal Type"
        />
      </View>

      {/* Event Type */}
      <View className="mb-6">
        <Text className="text-base font-semibold mb-2 text-olive-500">Event Type</Text>
        <ModalDropdown
          value={formData.event_type}
          options={eventTypes}
          onSelect={(value) => handleInputChange('event_type', value)}
          showModal={showEventTypeDropdown}
          setShowModal={setShowEventTypeDropdown}
          placeholder="Select Event Type..."
          title="Choose Event Type"
        />
      </View>

      {/* Date Selection */}
      <View className="mb-6">
        <Text className="text-base font-semibold mb-2 text-olive-500">Date *</Text>
        <TouchableOpacity
          className="border border-olive-400 rounded-lg p-3 bg-white"
          onPress={() => setShowDatePicker(true)}
        >
          <Text className="text-base text-olive-500">{formatDate(formData.booking_date)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.booking_date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>

      {/* Time Selection */}
      <View className="mb-6">
        <Text className="text-base font-semibold mb-2 text-olive-500">Time *</Text>
        <TouchableOpacity
          className="border border-olive-400 rounded-lg p-3 bg-white"
          onPress={() => setShowTimePicker(true)}
        >
          <Text className="text-base text-olive-500">{formatTime(formData.booking_time)}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={formData.booking_time}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>

      {/* Produce Supply */}
      <View className="mb-6">
        <Text className="text-base font-semibold mb-2 text-olive-500">Produce Supply</Text>
        <ModalDropdown
          value={formData.produce_supply}
          options={produceSupplyOptions}
          onSelect={(value) => handleInputChange('produce_supply', value)}
          showModal={showProduceDropdown}
          setShowModal={setShowProduceDropdown}
          placeholder="Select Produce Supply..."
          title="Choose Produce Supply"
        />
      </View>

      {/* Number of People */}
      <View className="mb-6">
        <Text className="text-base font-semibold mb-2 text-olive-500">Number of People *</Text>
        <TextInput
          className="border border-olive-400 rounded-lg p-3 text-base bg-white"
          value={formData.number_of_people}
          onChangeText={(value) => handleInputChange('number_of_people', value)}
          keyboardType="numeric"
          placeholder="Enter number of people"
          placeholderTextColor="#6b7280"
        />
      </View>

      {/* Customer Zip Code */}
      <View className="mb-6">
        <Text className="text-base font-semibold mb-2 text-olive-500">Your Zip Code *</Text>
        <TextInput
          className="border border-olive-400 rounded-lg p-3 text-base bg-white"
          value={formData.customer_zip}
          onChangeText={(value) => handleInputChange('customer_zip', value)}
          placeholder="Enter your zip code"
          maxLength={10}
          placeholderTextColor="#6b7280"
        />
      </View>

      {/* Special Notes */}
      <View className="mb-6">
        <Text className="text-base font-semibold mb-2 text-olive-500">Special Notes</Text>
        <TextInput
          className="border border-olive-400 rounded-lg p-3 text-base bg-white h-24 text-top"
          value={formData.special_notes}
          onChangeText={(value) => handleInputChange('special_notes', value)}
          placeholder="Any allergies, dietary restrictions, or special requests..."
          multiline
          numberOfLines={4}
          placeholderTextColor="#6b7280"
        />
      </View>

      {/* Search Button */}
      <TouchableOpacity
        className={`p-4 rounded-lg items-center mt-5 mb-10 ${loading ? 'bg-gray-400' : 'bg-olive-300'}`}
        onPress={searchChefs}
        disabled={loading}
      >
        <Text className="text-xl text-white font-semibold">
          {loading ? 'Searching...' : 'Find Available Chefs'}
        </Text>
      </TouchableOpacity>

      {/* Chef Results Modal */}
      <Modal
        visible={showChefResults}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-100">
          <View className="flex-row justify-between items-center p-5 bg-white border-b border-gray-200">
            <Text className="text-2xl font-bold text-olive-500">Available Chefs</Text>
            <TouchableOpacity
              className="p-2"
              onPress={() => setShowChefResults(false)}
            >
              <Text className="text-3xl text-gray-500">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-5">
            {availableChefs.length === 0 ? (
              <View className="items-center mt-12">
                <Text className="text-lg font-semibold text-gray-600 mb-2">No chefs available for your criteria</Text>
                <Text className="text-base text-gray-500 text-center">Try adjusting your date, time, or location</Text>
              </View>
            ) : (
              availableChefs.map((chef) => (
                <View key={chef.chef_id} className="bg-white rounded-xl p-5 mb-4 shadow-md shadow-black/10">
                  <View className="mb-4">
                    <Text className="text-xl font-bold text-olive-500 mb-1">{chef.name}</Text>
                    <Text className="text-base text-gray-600 mb-0.5">{chef.location}</Text>
                    <Text className="text-sm text-gray-500 mb-2">{chef.distance_miles} miles away</Text>
                    <Text className="text-sm text-gray-600 mb-3">
                      Specializes in: {chef.cuisines.join(', ')}
                    </Text>

                    <View className="bg-gray-50 p-3 rounded-lg">
                      <Text className="text-base text-olive-500 mb-1">
                        ${chef.base_rate_per_person}/person
                      </Text>
                      {formData.produce_supply === 'chef' && chef.produce_supply_extra_cost > 0 && (
                        <Text className="text-sm text-gray-600 mb-1">
                          +${chef.produce_supply_extra_cost} for ingredients
                        </Text>
                      )}
                      <Text className="text-lg font-bold text-olive-400">
                        Total: ${calculateTotalCost(chef)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    className={`p-3 rounded-lg items-center ${loading ? 'bg-gray-400' : 'bg-olive-400'}`}
                    onPress={() => bookChef(chef)}
                    disabled={loading}
                  >
                    <Text className="text-base text-white font-semibold">
                      {loading ? 'Booking...' : 'Book This Chef'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}