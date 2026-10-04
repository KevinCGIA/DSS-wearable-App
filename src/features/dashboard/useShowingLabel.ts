import { useBle } from '@/features/devices/BleProvider';

// Header label for detail pages: which device the Dashboard filter is showing.
export function useShowingLabel(deviceId: string | null): string {
  const ble = useBle();
  if (!deviceId) return 'All devices';
  const paired = ble.pairedDevices.find((d) => d.deviceId === deviceId);
  if (paired) return paired.name;
  return ble.connection.deviceId === deviceId ? (ble.connection.deviceName ?? 'Unknown device') : 'One device';
}
