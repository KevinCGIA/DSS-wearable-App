import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { SettingsScreen } from './SettingsScreen';

type Props = {
  bottomInset: number;
  signOut: () => void;
  onOpenDevices: () => void;
  onOpenAlertThresholds: () => void;
  onOpenNotifications: () => void;
  onOpenPreferences: () => void;
  onOpenPreviews?: () => void;
};

export function SettingsContainer({ signOut, ...rest }: Props) {
  // Same dialog as Android's logout() in app/(auth)/settings.tsx.
  const logout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  return <SettingsScreen {...rest} onLogout={logout} />;
}
