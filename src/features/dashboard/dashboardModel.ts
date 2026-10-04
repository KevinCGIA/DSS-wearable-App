import type { ConnectionState, ConnectionStatus, HistoryState, SensorReading } from '@/data/types';
import { isSameDay } from '@/lib/time';

export type RestingRange = { low: number; high: number; status: 'Low' | 'Normal' | 'High' };

function percentile(sorted: number[], p: number): number {
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[index];
}

// Middle 60% of the last 24h of readings, so short spikes don't widen the range.
export function restingRangeFrom(history: HistoryState): RestingRange | null {
  if (history.readings.length < 4) return null;
  const sorted = history.readings.map((r) => r.value).sort((a, b) => a - b);
  const low = Math.round(percentile(sorted, 0.2));
  const high = Math.round(percentile(sorted, 0.8));
  const status = low < 40 ? 'Low' : high > 100 ? 'High' : 'Normal';
  return { low, high, status };
}

// Android's StepsDisplay: a reading from before midnight means 0 steps today.
export function stepsTodayFrom(reading: SensorReading | null, now: number): number {
  if (!reading) return 0;
  return isSameDay(reading.timestamp, new Date(now)) ? Math.round(reading.value) : 0;
}

// One chip on the Dashboard's connected-devices strip.
export type DashboardDevice = {
  deviceId: string;
  name: string;
  status: ConnectionStatus;
  rssi: number | null;
};

// Devices that are connected or on their way (not idle/failed). Phase 1 BLE is single-device;
// Phase 2 Step B item 10 turns this into a per-device map.
export function connectedDevicesFrom(
  connections: ConnectionState[],
  rssiFor: (deviceId: string) => number | null,
): DashboardDevice[] {
  return connections
    .filter((c) => c.status !== 'disconnected' && c.deviceId)
    .map((c) => ({
      deviceId: c.deviceId as string,
      name: c.deviceName ?? 'Unknown device',
      status: c.status,
      rssi: rssiFor(c.deviceId as string),
    }));
}
