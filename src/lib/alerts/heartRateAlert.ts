import type { AlertItem, AlertThresholds, SensorReading } from '@/data/types';

export const ALERT_COOLDOWN_MS = 60000;

// The caller owns the last-alert time so this decision stays deterministic.
export function checkHeartRate(
  reading: SensorReading,
  thresholds: AlertThresholds,
  lastAlertAt: number | undefined = undefined,
  now = reading.timestamp.getTime(),
  allowTestData = false,
): Omit<AlertItem, 'id'> | null {
  if (!thresholds.enabled || reading.type !== 'heart_rate' || reading.resolution === 'representative') return null;
  if (reading.source !== 'ble' && !(allowTestData && reading.source === 'test')) return null;
  if (!reading.deviceId && reading.source === 'ble') return null;
  if (!Number.isFinite(reading.value) || !Number.isFinite(now)) return null;
  if (Math.abs(now - reading.timestamp.getTime()) > 10000) return null;
  const type = reading.value > thresholds.hrMax ? 'HR_HIGH' : reading.value < thresholds.hrMin ? 'HR_LOW' : null;
  if (!type || (lastAlertAt !== undefined && now - lastAlertAt < ALERT_COOLDOWN_MS)) return null;
  const limit = type === 'HR_HIGH' ? thresholds.hrMax : thresholds.hrMin;
  const deviceName = reading.deviceName || 'Unknown device';
  return {
    type,
    value: reading.value,
    message: `${deviceName} · Heart rate ${type === 'HR_HIGH' ? 'above' : 'below'} ${limit} BPM`,
    timestamp: now,
    deviceId: reading.deviceId,
    deviceName,
  };
}

export function alertCooldownKey(reading: SensorReading, type: AlertItem['type']) {
  return `${reading.deviceId ?? 'test-data'}:${type}`;
}
