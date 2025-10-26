import React, { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import Button from './Button';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import getEnvVars from '../../config';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function CalendarConnectButton({ onSynced }) {
  const { apiUrl } = getEnvVars();
  const { token, userId } = useAuth();

  // TODO: replace with your Google Web Client ID (from Google Cloud Console)
  const GOOGLE_WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID';

  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({ useProxy: true }),
    []
  );

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      redirectUri,
      extraParams: { access_type: 'offline', prompt: 'consent' },
    },
    discovery
  );

  useEffect(() => {
    const handleAuth = async () => {
      if (response?.type !== 'success') return;
      const code = response.params?.code;
      const code_verifier = request?.codeVerifier;
      if (!code || !code_verifier) return;

      try {
        const res = await fetch(`${apiUrl}/calendar/google/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            user_id: userId, // used by backend to store tokens per user
            code,
            code_verifier,
            redirect_uri: redirectUri,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          Alert.alert('Google Connect Failed', data.error || 'Could not exchange code.');
          return;
        }
        Alert.alert('Connected', 'Google Calendar connected.');
      } catch (e) {
        Alert.alert('Error', 'Network error during Google connect.');
      }
    };
    handleAuth();
  }, [response, request, apiUrl, token, userId, redirectUri]);

  const syncNow = async () => {
    try {
      const res = await fetch(`${apiUrl}/calendar/google/sync?user_id=${encodeURIComponent(userId)}&days=30`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Sync Failed', data.error || 'Unable to sync calendar.');
        return;
      }
      Alert.alert('Synced', `Fetched ${data.count || 0} events.`);
      onSynced && onSynced(data);
    } catch {
      Alert.alert('Error', 'Network error during sync.');
    }
  };

  return (
    <View>
      <Button
        title="Connect Google Calendar"
        variant="secondary"
        onPress={() => promptAsync({ useProxy: true, showInRecents: true })}
        disabled={!request}
      />
      <View style={{ height: 8 }} />
      <Button
        title="Sync Google Calendar"
        variant="secondary"
        onPress={syncNow}
      />
    </View>
  );
}