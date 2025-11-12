import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import getEnvVars from '../../config';

const { apiUrl } = getEnvVars();

const TestPaymentButton = ({ customerId, paymentMethodId }) => {
  const [loading, setLoading] = useState(false);

  const handleTestPayment = async () => {
    Alert.alert(
      'Test Payment',
      'Test a $1.00 charge with your saved card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test Payment',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${apiUrl}/stripe-payment/test-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  customer_id: customerId,
                  amount: 100, // $1.00 in cents
                  payment_method_id: paymentMethodId,
                }),
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert(
                  'Success! 🎉',
                  `${data.message}\n\nPayment ID: ${data.payment_intent_id}\nStatus: ${data.status}`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', data.error || 'Payment failed');
              }
            } catch (error) {
              console.error('Test payment error:', error);
              Alert.alert('Error', 'Failed to process test payment');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.testButton}
      onPress={handleTestPayment}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={styles.testButtonText}>Test Payment ($1.00)</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  testButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TestPaymentButton;
