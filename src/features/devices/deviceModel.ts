import type { ConnectionState, ConnectionStatus, PairedDevice, SensorReading } from '@/data/types';
import type { ConnectionEvent } from '@/lib/devices/connectionLog';
import { computeDeviceStats, healthBadge } from '@/lib/devices/deviceStats';
import type { DeviceStats, HealthBadge, Session } from '@/lib/devices/deviceStats';

// One card on the Devices tab: a device the researcher has tested, live or past.
export type TestedDevice = {
  deviceId: string;
  name: string;
  status: ConnectionStatus;
  attempt: number;
  // Last connect attempt failed (shown on the card).
  error: string | null;
  // Live while connected, otherwise the last known value.
  rssi: number | null;
  battery: number | null;
  lastConnectedAt: number | null;
  stats: DeviceStats;
  badge: HealthBadge | null;
  paused: boolean;
};

export type DevicesSummary = {
  connectedNow: number;
  devicesTested: number;
  readingsToday: number;
  successRate: number | null;
};

export type DevicesModel = {
  connected: TestedDevice[];
  previous: TestedDevice[];
  summary: DevicesSummary;
};

export type DevicesModelInput = {
  connections: Record<string, ConnectionState>;
  pairedDevices: PairedDevice[];
  events: ConnectionEvent[];
  heartRate: SensorReading[];
  steps: SensorReading[];
  pausedDevices: string[];
  now: number;
};

export function buildDevicesModel(input: DevicesModelInput): DevicesModel {
  const { connections, pairedDevices, events, heartRate, steps, pausedDevices, now } = input;
  const paired = new Map(pairedDevices.map((d) => [d.deviceId, d]));

  const make = (deviceId: string, connection: ConnectionState | undefined): TestedDevice => {
    const known = paired.get(deviceId);
    const status = connection?.status ?? 'disconnected';
    const stats = computeDeviceStats(deviceId, events, heartRate, steps, now);
    const live = status === 'connected';
    return {
      deviceId,
      name: connection?.deviceName ?? known?.name ?? 'Unknown device',
      status,
      attempt: connection?.attempt ?? 0,
      error: connection?.error ?? null,
      rssi: (status !== 'disconnected' ? connection?.rssi : null) ?? known?.lastRssi ?? null,
      battery: live ? (connection?.batteryLevel ?? null) : (known?.lastBattery ?? null),
      lastConnectedAt: known?.lastConnectedAt?.getTime() ?? null,
      stats,
      badge: healthBadge(stats, live, now),
      paused: pausedDevices.includes(deviceId),
    };
  };

  // Anything not idle counts as "now": connecting, setting up, connected, reconnecting, disconnecting.
  const activeIds = Object.entries(connections)
    .filter(([, c]) => c.status !== 'disconnected')
    .map(([id]) => id);
  const connected = activeIds.map((id) => make(id, connections[id]));
  const previous = pairedDevices
    .filter((d) => !activeIds.includes(d.deviceId))
    .map((d) => make(d.deviceId, connections[d.deviceId]))
    .sort((a, b) => (b.lastConnectedAt ?? 0) - (a.lastConnectedAt ?? 0));

  const shown = new Set([...connected, ...previous].map((d) => d.deviceId));
  const own = events.filter((e) => e.deviceId !== null && shown.has(e.deviceId));
  const successes = own.filter((e) => e.type === 'connected').length;
  const tries = successes + own.filter((e) => e.type === 'failed').length;

  return {
    connected,
    previous,
    summary: {
      connectedNow: connected.filter((d) => d.status === 'connected').length,
      devicesTested: shown.size,
      readingsToday: [...connected, ...previous].reduce((sum, d) => sum + d.stats.readingsToday, 0),
      successRate: tries ? successes / tries : null,
    },
  };
}

export function currentSession(device: TestedDevice): Session | null {
  const first = device.stats.sessions[0];
  return first && first.endedBy === 'ongoing' ? first : null;
}
