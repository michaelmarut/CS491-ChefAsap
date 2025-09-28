import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import getEnvVars from '../config';

export default function ChefAvailabilityPage({ userId }) {
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Don't render if no userId provided - early return
  if (!userId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Error: No user ID provided</Text>
      </View>
    );
  }

  const { apiUrl } = getEnvVars();

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const getInitialAvailability = () => {
    const initial = {};
    daysOfWeek.forEach(day => {
      initial[day.key] = {
        enabled: false,
        start_time: '09:00',
        end_time: '18:00'
      };
    });
    return initial;
  };

  const loadAvailability = async () => {
    console.log('📅 Loading chef availability for userId:', userId);
    
    try {
      const response = await fetch(`${apiUrl}/api/availability/chef/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Availability loaded:', result);
        
        // Start with default availability
        const availabilityMap = getInitialAvailability();

        // Update with server data
        if (result.availability && Array.isArray(result.availability)) {
          result.availability.forEach(slot => {
            if (availabilityMap[slot.day_of_week]) {
              availabilityMap[slot.day_of_week] = {
                enabled: true,
                start_time: slot.start_time,
                end_time: slot.end_time,
                id: slot.id
              };
            }
          });
        }

        setAvailability(availabilityMap);
      } else {
        console.error('❌ Failed to load availability');
        Alert.alert('Error', 'Failed to load availability schedule');
      }
    } catch (error) {
      console.error('🚨 Error loading availability:', error);
      Alert.alert('Error', 'Unable to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialize component
  useEffect(() => {
    // Initialize with default values first
    const initial = getInitialAvailability();
    setAvailability(initial);
    
    // Then load from server
    loadAvailability();
  }, []); // Only run once

  const saveAvailability = async () => {
    console.log('💾 Saving availability...');
    setSaving(true);

    try {
      // Convert availability object to array format for API
      const availabilityArray = [];
      Object.entries(availability).forEach(([day, schedule]) => {
        if (schedule && schedule.enabled) {
          availabilityArray.push({
            day_of_week: day,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            ...(schedule.id && { id: schedule.id })
          });
        }
      });

      const response = await fetch(`${apiUrl}/api/availability/chef/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availability: availabilityArray
        })
      });

      if (response.ok) {
        console.log('✅ Availability saved successfully');
        Alert.alert('Success', 'Your availability schedule has been updated!');
        // Reload to get updated IDs from server
        loadAvailability();
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save availability:', errorText);
        Alert.alert('Error', 'Failed to save availability schedule');
      }
    } catch (error) {
      console.error('🚨 Error saving availability:', error);
      Alert.alert('Error', 'Unable to connect to server');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayKey) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey]?.enabled
      }
    }));
  };

  const updateTimeSlot = (dayKey, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAvailability();
  };

  const formatTime = (time) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
      return `${hour12 === 0 ? 12 : hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return time; // Return original if formatting fails
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4d7c0f" />
        <Text style={styles.loadingText}>Loading your schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Availability Schedule</Text>
        <Text style={styles.subtitle}>Set when customers can book you</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {Object.keys(availability).length > 0 && daysOfWeek.map((day) => {
          const dayAvailability = availability[day.key];
          
          // Safety check - skip rendering if availability data not ready
          if (!dayAvailability) {
            return null;
          }
          
          return (
            <View key={day.key} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <TouchableOpacity 
                  style={styles.dayToggleContainer}
                  onPress={() => toggleDay(day.key)}
                >
                  <View style={[
                    styles.toggle,
                    dayAvailability.enabled ? styles.toggleActive : styles.toggleInactive
                  ]}>
                    {dayAvailability.enabled && <View style={styles.toggleIndicator} />}
                  </View>
                  <Text style={[
                    styles.dayLabel,
                    dayAvailability.enabled ? styles.dayLabelActive : styles.dayLabelInactive
                  ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>

                {dayAvailability.enabled && (
                  <Text style={styles.dayStatus}>
                    {formatTime(dayAvailability.start_time)} - {formatTime(dayAvailability.end_time)}
                  </Text>
                )}
              </View>

              {dayAvailability.enabled && (
                <View style={styles.timeContainer}>
                  <View style={styles.timeSlot}>
                    <Text style={styles.timeLabel}>Start Time</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                      {timeSlots.map((time) => (
                        <TouchableOpacity
                          key={`start-${time}`}
                          style={[
                            styles.timeButton,
                            dayAvailability.start_time === time && styles.timeButtonActive
                          ]}
                          onPress={() => updateTimeSlot(day.key, 'start_time', time)}
                        >
                          <Text style={[
                            styles.timeButtonText,
                            dayAvailability.start_time === time && styles.timeButtonTextActive
                          ]}>
                            {formatTime(time)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.timeSlot}>
                    <Text style={styles.timeLabel}>End Time</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                      {timeSlots
                        .filter(time => dayAvailability.start_time && time > dayAvailability.start_time)
                        .map((time) => (
                        <TouchableOpacity
                          key={`end-${time}`}
                          style={[
                            styles.timeButton,
                            dayAvailability.end_time === time && styles.timeButtonActive
                          ]}
                          onPress={() => updateTimeSlot(day.key, 'end_time', time)}
                        >
                          <Text style={[
                            styles.timeButtonText,
                            dayAvailability.end_time === time && styles.timeButtonTextActive
                          ]}>
                            {formatTime(time)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={saveAvailability}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>💾 Save Schedule</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefce8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fefce8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4d7c0f',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3f3f1f',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  dayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#4d7c0f',
  },
  toggleInactive: {
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  toggleIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  dayLabelActive: {
    color: '#3f3f1f',
  },
  dayLabelInactive: {
    color: '#9ca3af',
  },
  dayStatus: {
    fontSize: 14,
    color: '#4d7c0f',
    fontWeight: '500',
  },
  timeContainer: {
    marginTop: 16,
    gap: 12,
  },
  timeSlot: {
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  timeScroll: {
    flexDirection: 'row',
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeButtonActive: {
    backgroundColor: '#4d7c0f',
    borderColor: '#4d7c0f',
  },
  timeButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  timeButtonTextActive: {
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#4d7c0f',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
