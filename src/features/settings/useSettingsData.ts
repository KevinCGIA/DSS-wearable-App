import { Alert } from 'react-native';
import type { PairedDevice } from '@/data/types';
import { useBle } from '@/features/devices/BleProvider';
import { confirmForget } from '@/features/devices/bluetoothText';
import { useProfile } from '@/features/profile/ProfileProvider';
import { useNow } from '@/lib/useNow';

// App settings only; the personal profile lives on the Profile screen (iOS split, see CLAUDE.md).
export function useSettingsData(signOut: () => void) {
  const ble = useBle();
  const now = useNow(60 * 1000);
  const { profile, loading: profileLoading } = useProfile();

  const forgetDevice = (device: PairedDevice) => confirmForget(device, ble.forgetDevice);

  // Android: logout in app/(auth)/settings.tsx
  const logout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return {
    now,
    profile,
    profileLoading,
    connection: ble.connection,
    pairedDevices: ble.pairedDevices,
    autoConnect: ble.autoConnect,
    onConnect: (device: { id: string; name: string | null }) => {
      ble.connect(device);
    },
    onDisconnect: () => {
      ble.disconnect();
    },
    onForgetDevice: forgetDevice,
    onSetAutoConnect: (enabled: boolean) => {
      ble.setAutoConnect(enabled);
    },
    onLogout: logout,
  };
}
