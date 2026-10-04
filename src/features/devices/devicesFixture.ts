import { buildDeviceHistory, mockDeviceC } from '@/data/deviceHistory';
import { mockDeviceA, mockDeviceB } from '@/data/mocks';
import type { MockDevice } from '@/data/mocks';
import type { ConnectionState, PairedDevice, SensorReading } from '@/data/types';
import type { ConnectionEvent } from '@/lib/devices/connectionLog';
import { buildDevicesModel } from './deviceModel';
import type { DevicesModel } from './deviceModel';

// Previews only: the same history, event log and model the real Devices tab uses.

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

export const fixtureDeviceD: MockDevice = { id: 'C4:7D:20:9B:51:6E', name: 'Galaxy Watch7' };
export const fixtureDeviceE: MockDevice = { id: '3B:E8:52:0F:7A:D1', name: 'Garmin Venu 3' };
export { mockDeviceA, mockDeviceB, mockDeviceC };

type Live = {
  device: MockDevice;
  connectedMinAgo: number;
  // No readings for this long before now (Not responding when over a minute).
  silentMs?: number;
  rssi: number;
  battery: number | null;
};

type Copy = { device: MockDevice; from: MockDevice; shiftDays: number };

type Options = {
  live?: Live[];
  // Paired devices to keep (default: all with history).
  keep?: string[];
  // Extra devices with history copied from another device.
  copies?: Copy[];
};

type Event = Omit<ConnectionEvent, 'id'>;

export function devicesFixture(now: number, { live = [], keep, copies = [] }: Options = {}): DevicesModel {
  const history = buildDeviceHistory(now);
  let events: Event[] = [...history.events];
  let heartRate: SensorReading[] = [...history.readings];
  const steps: SensorReading[] = [];
  let paired: PairedDevice[] = [...history.paired];

  for (const [n, copy] of copies.entries()) {
    const shift = copy.shiftDays * DAY;
    const move = (t: number) => t - shift;
    events = events.concat(
      history.events
        .filter((e) => e.deviceId === copy.from.id)
        .map((e) => ({ ...e, deviceId: copy.device.id, timestamp: move(e.timestamp) })),
    );
    heartRate = heartRate.concat(
      history.readings
        .filter((r) => r.deviceId === copy.from.id)
        .map((r) => ({
          ...r,
          id: `${r.id}-copy${n}`,
          deviceId: copy.device.id,
          deviceName: copy.device.name,
          timestamp: new Date(move(r.timestamp.getTime())),
        })),
    );
    const source = history.paired.find((d) => d.deviceId === copy.from.id);
    if (source && copy.device.id !== copy.from.id) {
      paired.push({
        ...source,
        deviceId: copy.device.id,
        name: copy.device.name,
        addedAt: source.addedAt && new Date(move(source.addedAt.getTime())),
        lastConnectedAt: source.lastConnectedAt && new Date(move(source.lastConnectedAt.getTime())),
      });
    }
  }

  if (keep) paired = paired.filter((d) => keep.includes(d.deviceId));

  const connections: Record<string, ConnectionState> = {};
  for (const l of live) {
    const start = now - l.connectedMinAgo * MIN;
    events.push({ type: 'connect_attempt', deviceId: l.device.id, timestamp: start - 2600, attempt: 1 });
    events.push({ type: 'connected', deviceId: l.device.id, timestamp: start, connectMs: 2600 });
    const until = now - (l.silentMs ?? 0);
    let total = 0;
    for (let t = start + 5000, i = 0; t <= until; t += 15000, i++) {
      heartRate.push({
        id: `live-${l.device.id}-${i}`,
        type: 'heart_rate',
        value: 70 + Math.round(Math.sin(i / 4) * 6),
        unit: 'bpm',
        timestamp: new Date(t),
        deviceId: l.device.id,
        deviceName: l.device.name,
        source: 'ble',
      });
      if (i % 4 === 0) {
        total += 40 + (i % 7) * 9;
        steps.push({
          id: `live-steps-${l.device.id}-${i}`,
          type: 'steps',
          value: total,
          unit: 'steps',
          timestamp: new Date(t),
          deviceId: l.device.id,
          deviceName: l.device.name,
          source: 'ble',
        });
      }
    }
    connections[l.device.id] = {
      status: 'connected',
      deviceId: l.device.id,
      deviceName: l.device.name,
      attempt: 0,
      batteryLevel: l.battery,
      error: null,
      rssi: l.rssi,
    };
    const existing = paired.find((d) => d.deviceId === l.device.id);
    const entry: PairedDevice = {
      deviceId: l.device.id,
      name: l.device.name,
      addedAt: existing?.addedAt ?? new Date(start),
      lastConnectedAt: new Date(start),
      lastRssi: l.rssi,
      lastBattery: l.battery,
    };
    paired = [entry, ...paired.filter((d) => d.deviceId !== l.device.id)];
  }

  return buildDevicesModel({
    connections,
    pairedDevices: paired,
    events: events.sort((a, b) => a.timestamp - b.timestamp).map((e, i) => ({ ...e, id: `f${i}` })),
    heartRate: heartRate.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    steps,
    pausedDevices: [],
    now,
  });
}
