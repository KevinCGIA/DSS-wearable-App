import type { SensorReading } from '@/data/types';
import { isSameDay } from '@/lib/time';
import type { ConnectionEvent } from './connectionLog';
import {
  GAP_MS,
  NOT_RESPONDING_AFTER_MS,
  NOT_RESPONDING_SUCCESS_RATE,
  UNSTABLE_DROPOUTS_PER_HOUR,
  UNSTABLE_GAPS_PER_HOUR,
  UNSTABLE_SUCCESS_RATE,
} from './healthThresholds';

export type SessionEnd = 'user' | 'unexpected' | 'ongoing';

export type Session = {
  start: number;
  end: number | null;
  endedBy: SessionEnd;
  durationMs: number;
  readings: number;
  avgBpm: number | null;
};

export type HealthBadge = 'stable' | 'unstable' | 'not_responding';

export type DeviceStats = {
  sessions: Session[];
  totalSessions: number;
  connectedMs: number;
  totalReadings: number;
  avgBpm: number | null;
  successRate: number | null;
  avgConnectMs: number | null;
  dropOuts: number;
  reconnects: number;
  readingsPerMin: number | null;
  gaps: number;
  lastReadingAt: number | null;
  currentBpm: number | null;
  avg24hBpm: number | null;
  stepsToday: number | null;
  readingsToday: number;
};

type Interval = { start: number; end: number };

// App background/closed periods. Nothing that happens inside them counts as a gap or drop-out.
export function backgroundIntervals(events: ConnectionEvent[], now: number): Interval[] {
  const out: Interval[] = [];
  let start: number | null = null;
  for (const e of events) {
    if (e.type === 'app_background' && start === null) start = e.timestamp;
    if (e.type === 'app_foreground' && start !== null) {
      out.push({ start, end: e.timestamp });
      start = null;
    }
  }
  if (start !== null) out.push({ start, end: now });
  return out;
}

const inside = (t: number, intervals: Interval[]) => intervals.some((i) => t >= i.start && t <= i.end);
const overlap = (a: Interval, intervals: Interval[]) =>
  intervals.reduce((sum, i) => sum + Math.max(0, Math.min(a.end, i.end) - Math.max(a.start, i.start)), 0);

const avg = (values: number[]) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : null);

// Only this device's own BLE readings count; test/sample data (source 'manual') never does.
export function deviceReadings(readings: SensorReading[], deviceId: string): SensorReading[] {
  return readings.filter((r) => r.deviceId === deviceId && r.source === 'ble');
}

export function computeDeviceStats(
  deviceId: string,
  events: ConnectionEvent[],
  heartRate: SensorReading[],
  steps: SensorReading[],
  now: number,
): DeviceStats {
  const own = events.filter((e) => e.deviceId === deviceId);
  const background = backgroundIntervals(events, now);
  const hr = deviceReadings(heartRate, deviceId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const sessions: Session[] = [];
  let open: number | null = null;
  for (const e of own) {
    if (e.type === 'connected') open = e.timestamp;
    if (e.type === 'disconnected' && open !== null) {
      sessions.push(makeSession(open, e.timestamp, e.reason ?? 'user', hr, background));
      open = null;
    }
  }
  if (open !== null) sessions.push(makeSession(open, null, 'ongoing', hr, background, now));

  let gaps = 0;
  for (const s of sessions) {
    const end = s.end ?? now;
    const times = hr.filter((r) => r.resolution !== 'representative').map((r) => r.timestamp.getTime()).filter((t) => t >= s.start && t <= end);
    for (let i = 1; i < times.length; i++) {
      const span = { start: times[i - 1], end: times[i] };
      if (span.end - span.start - overlap(span, background) > GAP_MS) gaps += 1;
    }
  }

  const connected = own.filter((e) => e.type === 'connected');
  const failed = own.filter((e) => e.type === 'failed').length;
  const tries = connected.length + failed;
  const connectTimes = connected.map((e) => e.connectMs).filter((v): v is number => typeof v === 'number');
  const dropOuts = own.filter(
    (e) => e.type === 'disconnected' && e.reason === 'unexpected' && !inside(e.timestamp, background),
  ).length;
  const connectedMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);
  const sessionReadings = sessions.reduce((sum, s) => sum + s.readings, 0);

  const dayAgo = now - 24 * 60 * 60 * 1000;
  const today = new Date(now);
  const ownSteps = deviceReadings(steps, deviceId).filter((r) => isSameDay(r.timestamp, today));
  const last = hr[hr.length - 1];

  return {
    sessions: [...sessions].reverse(),
    totalSessions: sessions.length,
    connectedMs,
    totalReadings: hr.length,
    avgBpm: avg(hr.map((r) => r.value)),
    successRate: tries ? connected.length / tries : null,
    avgConnectMs: avg(connectTimes),
    dropOuts,
    reconnects: own.filter((e) => e.type === 'connect_attempt' && e.auto).length,
    readingsPerMin: connectedMs > 0 ? sessionReadings / (connectedMs / 60000) : null,
    gaps,
    lastReadingAt: last ? last.timestamp.getTime() : null,
    currentBpm: last && now - last.timestamp.getTime() <= NOT_RESPONDING_AFTER_MS ? Math.round(last.value) : null,
    avg24hBpm: avg(hr.filter((r) => r.timestamp.getTime() >= dayAgo).map((r) => r.value)),
    stepsToday: ownSteps.length ? Math.max(...ownSteps.map((r) => r.value)) : null,
    readingsToday: hr.filter((r) => isSameDay(r.timestamp, today)).length,
  };
}

function makeSession(start: number, end: number | null, endedBy: SessionEnd, hr: SensorReading[], background: Interval[], now = Date.now()): Session {
  const stop = end ?? now;
  const within = hr.filter((r) => r.timestamp.getTime() >= start && r.timestamp.getTime() <= stop);
  return {
    start,
    end,
    endedBy,
    durationMs: Math.max(0, stop - start - overlap({ start, end: stop }, background)),
    readings: within.length,
    avgBpm: avg(within.map((r) => r.value)),
  };
}

// null = no sessions yet (nothing to judge).
export function healthBadge(stats: DeviceStats, connectedNow: boolean, now: number): HealthBadge | null {
  const current = stats.sessions.find((s) => s.endedBy === 'ongoing');
  if (connectedNow && current) {
    const since = stats.lastReadingAt && stats.lastReadingAt >= current.start ? stats.lastReadingAt : current.start;
    if (now - since > NOT_RESPONDING_AFTER_MS) return 'not_responding';
  }
  if (stats.totalSessions === 0) {
    return stats.successRate === 0 ? 'not_responding' : null;
  }
  const last = stats.sessions[0];
  if (!connectedNow && last && last.readings === 0) return 'not_responding';
  if (stats.successRate !== null && stats.successRate < NOT_RESPONDING_SUCCESS_RATE) return 'not_responding';

  const hours = Math.max(stats.connectedMs / 3600000, 1 / 60);
  if (
    (stats.successRate !== null && stats.successRate < UNSTABLE_SUCCESS_RATE) ||
    stats.dropOuts / hours > UNSTABLE_DROPOUTS_PER_HOUR ||
    stats.gaps / hours > UNSTABLE_GAPS_PER_HOUR
  ) {
    return 'unstable';
  }
  return 'stable';
}

export function formatDurationMs(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return `${Math.max(0, Math.round(ms / 1000))}s`;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
