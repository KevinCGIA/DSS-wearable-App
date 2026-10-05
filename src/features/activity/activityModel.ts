import type { Bar } from '@/components/ui/BarChart';
import type { HistoryState, RestingHrTrends, SensorReading, SleepSummary, SleepTrends } from '@/data/types';
import { restingRangeFrom } from '@/features/dashboard/dashboardModel';
import type { RestingRange } from '@/features/dashboard/dashboardModel';
import { isSameDay } from '@/lib/time';

export type ActivitySection = 'heart-rate' | 'steps' | 'sleep';

// Chip keys: a deviceId, Test data (dev only), or readings saved without a deviceId (shared data rule).
export const TEST_SOURCE = 'test-data';
export const UNKNOWN_SOURCE = 'unknown-device';

export type ActivitySource = { key: string; label: string; latest: number };

const DAY_MS = 24 * 60 * 60 * 1000;

export function sourceKeyOf(reading: SensorReading): string {
  if (reading.source !== 'ble') return TEST_SOURCE;
  return reading.deviceId ?? UNKNOWN_SOURCE;
}

export type HeartRateView = {
  latest: SensorReading | null;
  history: HistoryState;
  restingRange: RestingRange | null;
  restingTrends: RestingHrTrends | null;
};

export type StepsView = {
  latest: SensorReading | null;
  history: HistoryState;
  daily: Bar[];
};

export type SleepView = { sleep: SleepSummary; trends: SleepTrends | null };

export type ActivityView = {
  sources: ActivitySource[];
  selected: string | null;
  // null = this source reports no data of that kind ("Not reported by this device").
  heartRate: HeartRateView | null;
  steps: StepsView | null;
  sleep: SleepView | null;
};

export type ActivityInput = {
  now: number;
  // Oldest first, as the readings store returns them.
  heartRate: SensorReading[];
  steps: SensorReading[];
  // Labels for chips: paired and connected devices by id.
  names: Record<string, string>;
  // Test data chip (dev builds only).
  includeTest: boolean;
  // The user's chip choice; null or gone = default.
  selected: string | null;
  // No source reports these yet in the real flow (sample sleep is Test data, dev only).
  sleepFor: (key: string) => SleepView | null;
  restingTrendsFor: (key: string) => RestingHrTrends | null;
};

export function buildActivity(input: ActivityInput): ActivityView {
  const { now, names, includeTest } = input;
  const usable = (r: SensorReading) => includeTest || r.source === 'ble';
  const heartRate = input.heartRate.filter(usable);
  const steps = input.steps.filter(usable);

  const latestBy = new Map<string, SensorReading>();
  for (const r of [...heartRate, ...steps]) {
    const key = sourceKeyOf(r);
    const known = latestBy.get(key);
    if (!known || known.timestamp < r.timestamp) latestBy.set(key, r);
  }

  const devices: ActivitySource[] = [...latestBy.entries()]
    .filter(([key]) => key !== TEST_SOURCE)
    .map(([key, r]) => ({
      key,
      label: key === UNKNOWN_SOURCE ? 'Unknown device' : (names[key] ?? r.deviceName ?? 'Unknown device'),
      latest: r.timestamp.getTime(),
    }))
    .sort((a, b) => b.latest - a.latest);

  const testHasData = latestBy.has(TEST_SOURCE) || input.sleepFor(TEST_SOURCE) !== null;
  const sources =
    includeTest && testHasData
      ? [...devices, { key: TEST_SOURCE, label: 'Test data', latest: latestBy.get(TEST_SOURCE)?.timestamp.getTime() ?? 0 }]
      : devices;

  const selected = sources.some((s) => s.key === input.selected) ? input.selected : (sources[0]?.key ?? null);
  if (!selected) return { sources, selected, heartRate: null, steps: null, sleep: null };

  const own = (readings: SensorReading[]) => readings.filter((r) => sourceKeyOf(r) === selected);
  const ownHr = own(heartRate);
  const ownSteps = own(steps);
  const dayStart = now - DAY_MS;

  const window = (readings: SensorReading[]): HistoryState => {
    const recent = readings.filter((r) => r.timestamp.getTime() >= dayStart);
    const last = recent[recent.length - 1];
    return {
      readings: recent,
      start: dayStart,
      end: Math.max(now, last ? last.timestamp.getTime() + 1 : 0),
      loading: false,
      error: null,
    };
  };

  const hrHistory = window(ownHr);
  const restingTrends = input.restingTrendsFor(selected);

  return {
    sources,
    selected,
    heartRate: ownHr.length
      ? {
          latest: ownHr[ownHr.length - 1],
          history: hrHistory,
          restingRange: restingRangeFrom(hrHistory),
          restingTrends,
        }
      : null,
    steps: ownSteps.length
      ? { latest: ownSteps[ownSteps.length - 1], history: window(ownSteps), daily: dailySteps(ownSteps, now) }
      : null,
    sleep: input.sleepFor(selected),
  };
}

// Steps are a device-reported running total per day, so a day's total is its highest reading.
export function dailySteps(readings: SensorReading[], now: number, days = 7): Bar[] {
  const out: Bar[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now - i * DAY_MS);
    const values = readings.filter((r) => isSameDay(r.timestamp, day)).map((r) => r.value);
    out.push({
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      value: values.length ? Math.round(Math.max(...values)) : 0,
    });
  }
  return out;
}
