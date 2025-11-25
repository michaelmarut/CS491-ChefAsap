import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Alert,
  StyleSheet
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import getEnvVars from '../../config';

import getTailwindColor from '../utils/getTailwindColor';
import Button from './Button';
import { useTheme } from '../providers/ThemeProvider';

const { apiUrl } = getEnvVars();

const AddCardModal = ({ visible, onClose, onSuccess, customerId }) => {
  const { createToken } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const { manualTheme } = useTheme();

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
      <View className='bg-black/50 h-full flex items-center justify-center'>
        <View className='bg-base-100 dark:bg-base-dark-100 border-4 border-primary-400 dark:border-dark-400 rounded-xl p-4'>
          {/* Header */}
          <Text className='text-2xl font-bold text-primary-400 dark:text-dark-400 text-center mb-6'>Add Bank Card</Text>

          {/* Card Input */}
          <View className='mb-6'>
            <CardField
              postalCodeEnabled={false}

              placeholder={{ number: 'XXXX XXXX XXXX XXXX', expiration: 'MM/YY', cvc: 'CVC' }}
              cardStyle={{
                backgroundColor: manualTheme === 'dark' ? 'black' : 'white',
                placeholderColor: manualTheme === 'dark' ? getTailwindColor('dark.200') : getTailwindColor('primary.200'),
                textColor: manualTheme === 'dark' ? getTailwindColor('dark.400') : getTailwindColor('primary.400'),
                borderWidth: 1,
                borderColor: manualTheme === 'dark' ? getTailwindColor('dark.300') : getTailwindColor('primary.300'),
                borderRadius: 8,
              }}
              style={{
                width: '100%',
                height: 50,
                marginVertical: 10,
              }}
              onCardChange={(cardDetails) => {
                console.log('Card details:', cardDetails);
                setCardComplete(cardDetails.complete);
              }}
            />

          </View>

          {/* Buttons */}
          <View className='flex-row justify-center gap-[4%]'>
            <Button
              title={'Cancel'}
              style='secondary'
              onPress={onClose}
              disabled={loading}
              customClasses='w-[48%]'
            />
            <Button
              title={'Add Card'}
              onPress={handleAddCard}
              disabled={!cardComplete || loading}
              customClasses='w-[48%]'
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddCardModal;
