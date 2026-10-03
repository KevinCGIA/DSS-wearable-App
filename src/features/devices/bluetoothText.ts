import { Alert } from 'react-native';
import type { BluetoothState, ConnectionState, PairedDevice } from '@/data/types';

// Wording copied from Android's services/ble/BleService.ts and app/(auth)/devices.tsx.

export function describeBluetoothState(state: BluetoothState): string {
  switch (state) {
    case 'PoweredOff':
      return 'Bluetooth is turned off. Turn it on to find your device.';
    case 'Unauthorized':
      return "Bluetooth permission was denied. Allow it in your phone's settings.";
    case 'Unsupported':
      return "This device doesn't support Bluetooth Low Energy.";
    case 'Resetting':
      return 'Bluetooth is restarting. Try again in a moment.';
    default:
      return "Bluetooth isn't ready yet. Try again in a moment.";
  }
}

export function bluetoothProblem(state: BluetoothState): string | null {
  return state !== 'PoweredOn' && state !== 'Unknown' ? describeBluetoothState(state) : null;
}

export type SignalStrength = { bars: 1 | 2 | 3 | 4; label: string };

export function signalFor(rssi: number): SignalStrength {
  if (rssi >= -60) return { bars: 4, label: 'Strong signal' };
  if (rssi >= -70) return { bars: 3, label: 'Good signal' };
  if (rssi >= -80) return { bars: 2, label: 'Good signal' };
  return { bars: 1, label: 'Weak signal' };
}

export function isBusy(connection: ConnectionState): boolean {
  return connection.status !== 'disconnected' && connection.status !== 'connected';
}

// Android: confirmForget in components/PairedDeviceList.tsx
export function confirmForget(device: PairedDevice, forget: (deviceId: string) => void) {
  Alert.alert('Forget Device', `Remove ${device.name}? You'll need to scan for it again to reconnect.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Forget', style: 'destructive', onPress: () => forget(device.deviceId) },
  ]);
}
