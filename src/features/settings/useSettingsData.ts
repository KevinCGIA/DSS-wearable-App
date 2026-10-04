import { Alert } from 'react-native';
import { useProfile } from '@/features/profile/ProfileProvider';

// App settings only; the personal profile lives on the Profile screen and devices on the Devices tab.
export function useSettingsData(signOut: () => void) {
  const { profile, loading: profileLoading } = useProfile();

  // Android: logout in app/(auth)/settings.tsx
  const logout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return {
    profile,
    profileLoading,
    onLogout: logout,
  };
}
