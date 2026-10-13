import type { AlertItem, ConnectionStatus } from '@/data/types';

// Alerts about the wearable itself, not about a reading.

export const LOW_BATTERY_PERCENT = 20;

type Device = { deviceId: string; deviceName: string | null };
type NewAlert = Omit<AlertItem, 'id'>;

const nameOf = (device: Device) => device.deviceName || 'Unknown device';

// Only after reconnecting has given up. `failed` rules out a user Cancel.
export function connectionLostAlert(
  before: ConnectionStatus | undefined,
  after: ConnectionStatus,
  failed: boolean,
  device: Device,
  now: number,
): NewAlert | null {
  if (before !== 'reconnecting' || after !== 'disconnected' || !failed) return null;
  return {
    type: 'DEVICE_DISCONNECTED',
    value: 0,
    message: `${nameOf(device)} · Connection lost and it couldn't reconnect`,
    timestamp: now,
    deviceId: device.deviceId,
    deviceName: nameOf(device),
  };
}

// one warning per connection
export function lowBatteryAlert(level: number | null, alreadyWarned: boolean, device: Device, now: number): NewAlert | null {
  if (level === null || !Number.isFinite(level) || level > LOW_BATTERY_PERCENT || alreadyWarned) return null;
  return {
    type: 'BATTERY_LOW',
    value: Math.round(level),
    message: `${nameOf(device)} · Battery at ${Math.round(level)}%`,
    timestamp: now,
    deviceId: device.deviceId,
    deviceName: nameOf(device),
  };
}

export const ALERT_TITLES: Record<AlertItem['type'], string> = {
  HR_HIGH: 'High heart rate',
  HR_LOW: 'Low heart rate',
  DEVICE_DISCONNECTED: 'Wearable disconnected',
  BATTERY_LOW: 'Wearable battery low',
};
