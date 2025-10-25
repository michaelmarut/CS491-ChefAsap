import React from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import getEnvVars from '../../config';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function CalendarIcsUploadButton() {
  const { apiUrl } = getEnvVars();
  const { userId } = useAuth();

  const upload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/calendar', 'application/octet-stream', 'application/ics'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;

      const file = res.assets[0];
      const form = new FormData();
      form.append('user_id', String(userId));
      form.append('ics', {
        uri: file.uri,
        name: file.name || 'calendar.ics',
        type: 'text/calendar',
      });

      const r = await fetch(`${apiUrl}/api/calendar/ics/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: form,
      });
      const data = await r.json();
      if (r.ok) {
        Alert.alert('Imported', `${data.imported || 0} events imported`);
      } else {
        Alert.alert('Error', data.error || 'Failed to import');
      }
    } catch (e) {
      Alert.alert('Error', 'Upload failed');
    }
  };

  return (
    <Button title="Import .ics Calendar" variant="secondary" onPress={upload} />
  );
}