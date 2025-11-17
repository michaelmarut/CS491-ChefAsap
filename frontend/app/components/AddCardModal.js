import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import getEnvVars from '../../config';

const { apiUrl } = getEnvVars();

const AddCardModal = ({ visible, onClose, onSuccess, customerId }) => {
  const { createToken } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleAddCard = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please fill in complete card information');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Stripe Token
      console.log('Creating Stripe token...');
      const { token, error } = await createToken({
        type: 'Card',
      });

      if (error) {
        console.error('Stripe token error:', error);
        Alert.alert('Error', error.message || 'Unable to create payment token');
        return;
      }

      if (!token) {
        Alert.alert('Error', 'Unable to get payment token');
        return;
      }

      console.log('Token created:', token.id);

      // 2. Send token to backend, save to Stripe
      const url = `${apiUrl}/stripe-payment/attach-payment-method`;
      console.log('Sending request to:', url);
      console.log('Request body:', { customer_id: customerId, token_id: token.id });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          token_id: token.id,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Get response text first to see what we're getting
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Received text:', responseText);
        throw new Error('Server returned invalid response. Please check backend logs.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add card');
      }

      console.log('Card added successfully:', data);
      Alert.alert('Success', 'Card added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess && onSuccess();
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error('Add card error:', error);
      Alert.alert('Error', error.message || 'An error occurred while adding card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Bank Card</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Card Input */}
          <View style={styles.cardFieldContainer}>
            <CardField
              postalCodeEnabled={false}
              placeholder={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={{
                backgroundColor: '#FFFFFF',
                textColor: '#000000',
                borderWidth: 1,
                borderColor: '#CCCCCC',
                borderRadius: 8,
              }}
              style={styles.cardField}
              onCardChange={(cardDetails) => {
                console.log('Card details:', cardDetails);
                setCardComplete(cardDetails.complete);
              }}
            />
            <Text style={styles.helperText}>
              Test card: 4242 4242 4242 4242 | Any future date | Any CVC
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.addButton,
                (!cardComplete || loading) && styles.disabledButton,
              ]}
              onPress={handleAddCard}
              disabled={!cardComplete || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>Add Card</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  cardFieldContainer: {
    marginBottom: 24,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#3B82F6',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});

export default AddCardModal;
