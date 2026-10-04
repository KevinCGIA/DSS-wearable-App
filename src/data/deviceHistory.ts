import type { ConnectionEvent } from '@/lib/devices/connectionLog';
import { mockDeviceA, mockDeviceB } from './mocks';
import type { MockDevice } from './mocks';
import type { PairedDevice, SensorReading } from './types';

// Mock history for previously connected devices (same shapes Phase 2 records for real).
// Everything is older than 24 h, so the Dashboard's 24 h views stay empty until a device connects.

export const mockDeviceC: MockDevice = { id: '7F:11:E4:62:AA:03', name: 'Mi Smart Band 8' };

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const READING_EVERY_MS = 15 * 1000;

type SessionPlan = {
  daysAgo: number;
  minutes: number;
  endedBy: 'user' | 'unexpected';
  failedBefore?: number;
  connectMs?: number;
  // minutes into the session with no readings (a gap)
  gap?: [number, number];
  // minutes into the session the app spent in the background
  background?: [number, number];
  noReadings?: boolean;
  reconnectAfter?: boolean;
};

type DevicePlan = { device: MockDevice; rssi: number; battery: number | null; base: number; sessions: SessionPlan[] };

const plans: DevicePlan[] = [
  {
    device: mockDeviceA,
    rssi: -56,
    battery: 81,
    base: 70,
    sessions: [
      { daysAgo: 1.1, minutes: 62, endedBy: 'user', connectMs: 2300 },
      { daysAgo: 2, minutes: 48, endedBy: 'user', connectMs: 2600 },
      { daysAgo: 3, minutes: 75, endedBy: 'user', connectMs: 2100, background: [20, 32] },
      { daysAgo: 5, minutes: 55, endedBy: 'user', connectMs: 2900 },
      { daysAgo: 7, minutes: 40, endedBy: 'user', connectMs: 2400 },
      { daysAgo: 9, minutes: 66, endedBy: 'user', connectMs: 3100 },
    ],
  },
  {
    device: mockDeviceB,
    rssi: -74,
    battery: null,
    base: 76,
    sessions: [
      { daysAgo: 1.6, minutes: 38, endedBy: 'unexpected', connectMs: 5200, failedBefore: 1, reconnectAfter: true },
      { daysAgo: 4, minutes: 45, endedBy: 'unexpected', connectMs: 6100, gap: [12, 17] },
      { daysAgo: 6, minutes: 30, endedBy: 'user', connectMs: 4800, failedBefore: 1 },
      { daysAgo: 8, minutes: 25, endedBy: 'unexpected', connectMs: 7000 },
    ],
  },
  {
    device: mockDeviceC,
    rssi: -89,
    battery: 22,
    base: 68,
    sessions: [
      { daysAgo: 2.5, minutes: 6, endedBy: 'unexpected', connectMs: 9800, failedBefore: 3, noReadings: true },
      { daysAgo: 10, minutes: 20, endedBy: 'unexpected', connectMs: 8700, failedBefore: 2 },
    ],
  },
];

const wobble = (i: number) => Math.round((Math.sin(i * 1.3) + Math.sin(i * 0.45)) * 4);

export function buildDeviceHistory(now = Date.now()) {
  const events: Omit<ConnectionEvent, 'id'>[] = [];
  const readings: SensorReading[] = [];
  const paired: PairedDevice[] = [];

  for (const plan of plans) {
    const { device } = plan;
    let lastEnd = 0;
    let firstStart = Infinity;

    for (const [index, s] of plan.sessions.entries()) {
      const start = now - s.daysAgo * DAY;
      const end = start + s.minutes * MIN;
      const firstTry = start - (s.connectMs ?? 3000) - (s.failedBefore ?? 0) * 12000;
      let t = firstTry;

      for (let f = 0; f < (s.failedBefore ?? 0); f++) {
        events.push({ type: 'connect_attempt', deviceId: device.id, timestamp: t, attempt: 1 });
        events.push({ type: 'failed', deviceId: device.id, timestamp: t + 10000 });
        t += 12000;
      }
      events.push({ type: 'connect_attempt', deviceId: device.id, timestamp: t, attempt: 1 });
      events.push({ type: 'connected', deviceId: device.id, timestamp: start, connectMs: start - t });
      if (s.background) {
        events.push({ type: 'app_background', deviceId: null, timestamp: start + s.background[0] * MIN });
        events.push({ type: 'app_foreground', deviceId: null, timestamp: start + s.background[1] * MIN });
      }
      events.push({ type: 'disconnected', deviceId: device.id, timestamp: end, reason: s.endedBy });
      if (s.reconnectAfter) {
        events.push({ type: 'connect_attempt', deviceId: device.id, timestamp: end + 1000, attempt: 1, auto: true });
        events.push({ type: 'connect_attempt', deviceId: device.id, timestamp: end + 3000, attempt: 2, auto: true });
        events.push({ type: 'failed', deviceId: device.id, timestamp: end + 13000 });
      }

      // A reading every 15 s while connected (under the 30 s gap threshold).
      if (!s.noReadings) {
        for (let q = 0; q < s.minutes * 4; q++) {
          const m = q / 4;
          const inGap = s.gap && m >= s.gap[0] && m < s.gap[1];
          if (inGap) continue;
          const time = start + q * READING_EVERY_MS + 7 * 1000;
          readings.push({
            id: `hist-${device.id}-${index}-${q}`,
            type: 'heart_rate',
            value: plan.base + wobble(q / 2 + index * 7),
            unit: 'bpm',
            timestamp: new Date(time),
            deviceId: device.id,
            deviceName: device.name,
            source: 'ble',
          });
        }
      }
      lastEnd = Math.max(lastEnd, end);
      firstStart = Math.min(firstStart, start);
    }

    paired.push({
      deviceId: device.id,
      name: device.name,
      addedAt: new Date(firstStart),
      lastConnectedAt: new Date(lastEnd),
      lastRssi: plan.rssi,
      lastBattery: plan.battery,
    });
  }

  paired.sort((a, b) => (b.lastConnectedAt?.getTime() ?? 0) - (a.lastConnectedAt?.getTime() ?? 0));
  return { events, readings, paired };
}
