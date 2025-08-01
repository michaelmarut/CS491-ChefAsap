import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
          style={styles.dropdownButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={[styles.dropdownButtonText, !displayValue && styles.placeholderText]}>
            {displayText}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        
        <Modal
          visible={showModal}
          animationType="slide"
          presentationStyle="pageSheet"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalList}>
                {options.map((option, index) => {
                  const optionValue = typeof option === 'string' ? option : option.value;
                  const optionLabel = typeof option === 'string' ? option : option.label;
                  const isSelected = optionValue === value;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                      onPress={() => {
                        onSelect(optionValue);
                        setShowModal(false);
                      }}
                    >
                      <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                        {optionLabel}
                      </Text>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Book a Chef</Text>

      {/* Cuisine Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cuisine Type *</Text>
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
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Meal Type</Text>
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
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Type</Text>
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
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date *</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>{formatDate(formData.booking_date)}</Text>
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
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Time *</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateButtonText}>{formatTime(formData.booking_time)}</Text>
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
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Produce Supply</Text>
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
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Number of People *</Text>
        <TextInput
          style={styles.input}
          value={formData.number_of_people}
          onChangeText={(value) => handleInputChange('number_of_people', value)}
          keyboardType="numeric"
          placeholder="Enter number of people"
        />
      </View>

      {/* Customer Zip Code */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Your Zip Code *</Text>
        <TextInput
          style={styles.input}
          value={formData.customer_zip}
          onChangeText={(value) => handleInputChange('customer_zip', value)}
          placeholder="Enter your zip code"
          maxLength={10}
        />
      </View>

      {/* Special Notes */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Special Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.special_notes}
          onChangeText={(value) => handleInputChange('special_notes', value)}
          placeholder="Any allergies, dietary restrictions, or special requests..."
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Search Button */}
      <TouchableOpacity 
        style={[styles.searchButton, loading && styles.disabledButton]}
        onPress={searchChefs}
        disabled={loading}
      >
        <Text style={styles.searchButtonText}>
          {loading ? 'Searching...' : 'Find Available Chefs'}
        </Text>
      </TouchableOpacity>

      {/* Chef Results Modal */}
      <Modal
        visible={showChefResults}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Available Chefs</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowChefResults(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chefList}>
            {availableChefs.length === 0 ? (
              <View style={styles.noChefs}>
                <Text style={styles.noChefText}>No chefs available for your criteria</Text>
                <Text style={styles.noChefSubtext}>Try adjusting your date, time, or location</Text>
              </View>
            ) : (
              availableChefs.map((chef) => (
                <View key={chef.chef_id} style={styles.chefCard}>
                  <View style={styles.chefInfo}>
                    <Text style={styles.chefName}>{chef.name}</Text>
                    <Text style={styles.chefLocation}>{chef.location}</Text>
                    <Text style={styles.chefDistance}>{chef.distance_miles} miles away</Text>
                    <Text style={styles.chefCuisines}>
                      Specializes in: {chef.cuisines.join(', ')}
                    </Text>
                    
                    <View style={styles.pricingInfo}>
                      <Text style={styles.priceText}>
                        ${chef.base_rate_per_person}/person
                      </Text>
                      {formData.produce_supply === 'chef' && chef.produce_supply_extra_cost > 0 && (
                        <Text style={styles.extraCostText}>
                          +${chef.produce_supply_extra_cost} for ingredients
                        </Text>
                      )}
                      <Text style={styles.totalCostText}>
                        Total: ${calculateTotalCost(chef)}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.bookButton, loading && styles.disabledButton]}
                    onPress={() => bookChef(chef)}
                    disabled={loading}
                  >
                    <Text style={styles.bookButtonText}>
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fefce8', // soft cream
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#3f3f1f', // earthy dark olive
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#3f3f1f',
  },
  input: {
    borderWidth: 1,
    borderColor: '#4d7c0f', // rich olive
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#4d7c0f',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#4d7c0f',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#3f3f1f',
  },
  searchButton: {
    backgroundColor: '#65a30d', // olive green
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3f3f1f',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  chefList: {
    flex: 1,
    padding: 20,
  },
  noChefs: {
    alignItems: 'center',
    marginTop: 50,
  },
  noChefText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  noChefSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  chefCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chefInfo: {
    marginBottom: 15,
  },
  chefName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3f3f1f',
    marginBottom: 5,
  },
  chefLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 3,
  },
  chefDistance: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  chefCuisines: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  pricingInfo: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 16,
    color: '#3f3f1f',
    marginBottom: 3,
  },
  extraCostText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  totalCostText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4d7c0f',
  },
  bookButton: {
    backgroundColor: '#4d7c0f', // match olive tone
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#3f3f1f',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3f3f1f',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemSelected: {
    backgroundColor: '#e7f5d3',
  },
  modalItemText: {
    fontSize: 16,
    color: '#3f3f1f',
    flex: 1,
  },
  modalItemTextSelected: {
    color: '#4d7c0f',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#4d7c0f',
    fontWeight: 'bold',
  },
});

