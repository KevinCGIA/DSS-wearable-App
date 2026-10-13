import type { ConnectionState, HistoryState, SensorReading } from '@/data/types';
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

export type DeviceTone = 'idle' | 'active' | 'pending' | 'failed';

export type DeviceView = {
  tone: DeviceTone;
  name: string;
  status: string | null;
  battery: number | null;
  hint: string | null;
};

export function deviceViewFrom(connection: ConnectionState, refreshing: boolean): DeviceView {
  const name = connection.deviceName ?? 'No Device';
  const attempt = connection.attempt > 0 ? `Attempt ${connection.attempt} of 3` : null;

  switch (connection.status) {
    case 'connected':
      return refreshing
        ? { tone: 'active', name, status: 'SYNCING', battery: connection.batteryLevel, hint: null }
        : { tone: 'active', name, status: 'CONNECTED', battery: connection.batteryLevel, hint: null };
    case 'discovering':
      return { tone: 'pending', name, status: 'SYNCING', battery: null, hint: 'Setting up device…' };
    case 'connecting':
      return { tone: 'pending', name, status: 'CONNECTING', battery: null, hint: attempt };
    case 'reconnecting':
      return { tone: 'pending', name, status: 'RECONNECTING', battery: null, hint: attempt };
    case 'disconnecting':
      return { tone: 'pending', name, status: 'DISCONNECTING', battery: null, hint: null };
    case 'disconnected':
      return connection.error
        ? { tone: 'failed', name, status: 'FAILED', battery: null, hint: 'Tap to retry' }
        : { tone: 'idle', name: 'No Device', status: null, battery: null, hint: 'Tap to connect' };
  }
}

// One connected (or connecting) device, for the expanded device card and the multi-device ring.
export type DeviceSummary = {
  deviceId: string;
  name: string;
  status: ConnectionState['status'];
  rssi: number | null;
  batteryLevel: number | null;
  lastSync: number | null;
};

const PENDING_ORDER: ConnectionState['status'][] = ['reconnecting', 'connecting', 'discovering', 'disconnecting'];

export function statusLabel(status: ConnectionState['status']): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'discovering':
      return 'Syncing';
    case 'connecting':
      return 'Connecting';
    case 'reconnecting':
      return 'Reconnecting';
    case 'disconnecting':
      return 'Disconnecting';
    case 'disconnected':
      return 'Not connected';
  }
}

// Ring for one device: as before. For several: "<n> devices connected", the worst status and the weakest signal.
export function ringViewFrom(
  devices: DeviceSummary[],
  connection: ConnectionState,
  refreshing: boolean,
): DeviceView {
  if (devices.length < 2) return deviceViewFrom(connection, refreshing);

  const worst = PENDING_ORDER.find((s) => devices.some((d) => d.status === s));
  const withSignal = devices.filter((d) => d.rssi !== null);
  const weakest = withSignal.length
    ? withSignal.reduce((a, b) => ((a.rssi as number) <= (b.rssi as number) ? a : b))
    : null;

  return {
    tone: worst ? 'pending' : 'active',
    name: `${devices.length} devices connected`,
    status: worst ? statusLabel(worst).toUpperCase() : refreshing ? 'SYNCING' : 'CONNECTED',
    battery: null,
    hint: weakest ? `Weakest: ${weakest.name} · ${weakest.rssi} dBm` : null,
  };
}
