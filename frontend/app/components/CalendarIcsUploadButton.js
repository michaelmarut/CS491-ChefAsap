import React, { useCallback } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import getEnvVars from '../../config';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function CalendarIcsUploadButton({ compact = false, ...props }) {
  const { apiUrl } = getEnvVars();
  const { token, userType, profileId } = useAuth();

  const pickAndUpload = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/calendar', 'application/octet-stream', 'application/ics'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;

      const file = res.assets[0];
      const form = new FormData();
      // Provide the booking owner (customer profile id)
      if (userType === 'customer' && profileId) {
        form.append('customer_id', String(profileId));
      }
      form.append('ics', {
        uri: file.uri,
        name: file.name || 'calendar.ics',
        type: file.mimeType || 'text/calendar',
      });

      await fetch(`${apiUrl}/calendar/ics/upload`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });
      //response handling
    } catch (e) {
      Alert.alert('Error', 'Upload failed');
    }
  }, [apiUrl, token, userType, profileId]);

  // Render compact pill or full button
  if (compact) {
    const pill = {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: '#d1d5db',
      backgroundColor: '#ffffff',
    };
    const txt = { fontSize: 12, color: '#111827' };

    return (
      <TouchableOpacity onPress={pickAndUpload} style={pill}>
        <Text style={txt}>Upload .ics</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Button title="Import .ics Calendar" variant="secondary" onPress={pickAndUpload} {...props} />
  );
}
