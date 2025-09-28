import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput
} from 'react-native';
import getEnvVars from '../config';

export default function ChefBookingsPage({ userId = 9 }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [responseNote, setResponseNote] = useState('');

  const { apiUrl } = getEnvVars();

  // Debug logging
  console.log('🧑‍🍳 ChefBookingsPage - userId:', userId);

  useEffect(() => {
    loadBookings();
  }, [userId]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const url = `${apiUrl}/api/bookings?role=chef&user_id=${userId}`;
      console.log('🧑‍🍳 Chef API Call:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🧑‍🍳 Chef bookings response:', data);
      console.log('🧑‍🍳 Number of bookings returned:', data?.length || 0);
      console.log('🧑‍🍳 Chef ID filter check - looking for chef_id:', userId);
      
      if (response.ok) {
        // Verify each booking belongs to this chef
        const filteredBookings = Array.isArray(data) ? data.filter(booking => {
          console.log(`🧑‍🍳 Booking ${booking.id}: chef_id=${booking.chef_id}, expected=${userId}`);
          return booking.chef_id === parseInt(userId);
        }) : [];
        
        console.log('🧑‍🍳 Filtered bookings for chef:', filteredBookings.length);
        setBookings(filteredBookings);
      } else {
        Alert.alert('Error', data.error || 'Failed to load bookings');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'accepted': '#10b981', 
      'rejected': '#ef4444',
      'cancelled_by_customer': '#6b7280',
      'cancelled_by_chef': '#6b7280',
      'completed': '#3b82f6'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'rejected': 'Rejected', 
      'cancelled_by_customer': 'Cancelled by Customer',
      'cancelled_by_chef': 'Cancelled by Chef',
      'completed': 'Completed'
    };
    return texts[status] || status;
  };

  const formatDateTime = (datetime) => {
    return new Date(datetime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canAccept = (booking) => {
    return booking.status === 'pending';
  };

  const canReject = (booking) => {
    return booking.status === 'pending';
  };

  const canCancel = (booking) => {
    return booking.status === 'accepted';
  };

  const handleBookingAction = async (bookingId, action, note = '') => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/bookings/${bookingId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          user_type: 'chef',
          note: note
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', `Booking ${action}ed successfully`);
        setShowDetailModal(false);
        setResponseNote('');
        loadBookings(); // Refresh the list
      } else {
        Alert.alert('Error', data.error || `Failed to ${action} booking`);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => {
        setSelectedBooking(item);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingId}>Booking #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.bookingInfo}>
        <Text style={styles.customerName}>
          Customer: {item.customer_first_name} {item.customer_last_name}
        </Text>
        
        <Text style={styles.bookingTime}>
          📅 {formatDateTime(item.start_time)} - {formatDateTime(item.end_time)}
        </Text>
        
        {item.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            💬 {item.notes}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Chef Bookings</Text>
        <Text style={styles.userInfoText}>
          Your Chef Bookings (ID: {userId})
        </Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {loading ? 'Loading bookings...' : 'No bookings found'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Wait for customers to book your services
            </Text>
          </View>
        }
        contentContainerStyle={bookings.length === 0 ? styles.emptyContainer : null}
      />

      {/* Booking Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Booking Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedBooking && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Booking ID:</Text>
                <Text style={styles.detailValue}>#{selectedBooking.id}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedBooking.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(selectedBooking.status)}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue}>
                  {selectedBooking.customer_first_name} {selectedBooking.customer_last_name}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Date & Time:</Text>
                <Text style={styles.detailValue}>
                  From: {formatDateTime(selectedBooking.start_time)}
                </Text>
                <Text style={styles.detailValue}>
                  To: {formatDateTime(selectedBooking.end_time)}
                </Text>
              </View>

              {selectedBooking.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValue}>{selectedBooking.notes}</Text>
                </View>
              )}

              <View style={styles.actionSection}>
                {(canReject(selectedBooking) || canCancel(selectedBooking)) && (
                  <>
                    <Text style={styles.actionLabel}>Response Note (Optional):</Text>
                    <TextInput
                      style={styles.noteInput}
                      value={responseNote}
                      onChangeText={setResponseNote}
                      placeholder="Add a note for your response..."
                      multiline
                      numberOfLines={3}
                    />
                  </>
                )}

                <View style={styles.actionButtons}>
                  {canAccept(selectedBooking) && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleBookingAction(selectedBooking.id, 'accept', responseNote)}
                    >
                      <Text style={styles.actionButtonText}>Accept</Text>
                    </TouchableOpacity>
                  )}

                  {canReject(selectedBooking) && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleBookingAction(selectedBooking.id, 'reject', responseNote)}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  )}

                  {canCancel(selectedBooking) && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleBookingAction(selectedBooking.id, 'cancel', responseNote)}
                    >
                      <Text style={styles.actionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3f3f1f',
    marginBottom: 15,
  },
  userInfoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4d7c0f',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  bookingInfo: {
    gap: 6,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  bookingTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  notes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 20,
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  actionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});