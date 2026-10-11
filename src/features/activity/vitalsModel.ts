import type { SensorReading, SensorType } from '@/data/types';
import { type MetricDefinition, VITAL_METRICS } from '@/lib/biometrics/metrics';
import { averageByBucket, type Bucket, HOUR_MS } from '@/lib/trends';

// Builds a card per extra biometric (beyond heart rate, steps and sleep) for one source.
// Only metrics the source has actually reported get a card; nothing is estimated.

const DAY_MS = 24 * HOUR_MS;

export type VitalValue = { value: number; secondary: number | null; timestamp: Date };
export type VitalStats = { low: number; average: number; high: number; secondaryAverage: number | null };

type Base = { metric: MetricDefinition; type: SensorType; latest: VitalValue };

// A stream: latest value + the last 24 hours as 30-minute averages
export type LiveVital = Base & { kind: 'live'; stats: VitalStats; buckets: Bucket[]; start: number; end: number };
// Occasional measurements: latest + last 7 days
export type SpotVital = Base & { kind: 'spot'; stats: VitalStats; recent: VitalValue[]; count: number };
// A device running total: today's increase + per-hour bars
export type TotalVital = Base & { kind: 'total'; today: number; buckets: Bucket[]; start: number; end: number };

export type VitalView = LiveVital | SpotVital | TotalVital;

export type VitalReadings = Partial<Record<SensorType, SensorReading[]>>;

function stats(values: number[], secondary: number[] = []): VitalStats {
  const avg = (list: number[]) => list.reduce((sum, v) => sum + v, 0) / list.length;
  return {
    low: Math.min(...values),
    average: avg(values),
    high: Math.max(...values),
    secondaryAverage: secondary.length ? avg(secondary) : null,
  };
}

// Device running totals (energy, distance) accumulate since the device last reset them,
// not since midnight: a rise adds the difference, a drop means the device reset and the new
// value is counted. Each device is handled on its own, like steps.
export function totalsByBucket(readings: SensorReading[], start: number, end: number, bucketMs: number): Bucket[] {
  const buckets: Bucket[] = [];
  for (let t = start; t < end; t += bucketMs) buckets.push({ start: t, end: Math.min(t + bucketMs, end), value: 0 });
  const byDevice = new Map<string, SensorReading[]>();
  for (const r of readings) {
    const key = r.deviceId ?? `test:${r.source}`;
    byDevice.set(key, [...(byDevice.get(key) ?? []), r]);
  }
  for (const group of byDevice.values()) {
    for (let i = 1; i < group.length; i += 1) {
      const delta = group[i].value >= group[i - 1].value ? group[i].value - group[i - 1].value : group[i].value;
      const index = Math.floor((group[i].timestamp.getTime() - start) / bucketMs);
      if (index >= 0 && index < buckets.length) buckets[index].value = (buckets[index].value ?? 0) + delta;
    }
  }
  return buckets;
}

function startOfDay(now: number) {
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
}

// readings: one source's readings by type, oldest first
export function buildVitals(readings: VitalReadings, now: number): VitalView[] {
  const views: VitalView[] = [];

  for (const metric of VITAL_METRICS) {
    const [type, secondaryType] = metric.types;
    const own = readings[type] ?? [];
    if (!own.length) continue;
    const last = own[own.length - 1];

    if (metric.kind === 'spot') {
      const weekAgo = now - 7 * DAY_MS;
      const pairs = (secondaryType ? readings[secondaryType] ?? [] : []).reduce<Map<number, number>>((map, r) => {
        map.set(r.timestamp.getTime(), r.value);
        return map;
      }, new Map());
      const values: VitalValue[] = own.map((r) => ({
        value: r.value,
        secondary: secondaryType ? (pairs.get(r.timestamp.getTime()) ?? null) : null,
        timestamp: r.timestamp,
      }));
      const week = values.filter((v) => v.timestamp.getTime() >= weekAgo);
      const basis = week.length ? week : values.slice(-1);
      views.push({
        kind: 'spot',
        metric,
        type,
        latest: values[values.length - 1],
        stats: stats(
          basis.map((v) => v.value),
          basis.map((v) => v.secondary).filter((v): v is number => v !== null),
        ),
        recent: [...values].reverse().slice(0, 5),
        count: week.length,
      });
      continue;
    }

    if (metric.kind === 'total') {
      const start = startOfDay(now);
      const end = Math.max(now, last.timestamp.getTime() + 1);
      // Readings from before midnight give today's first reading something to compare with
      const sinceYesterday = own.filter((r) => r.timestamp.getTime() >= start - DAY_MS);
      const buckets = totalsByBucket(sinceYesterday, start, end, HOUR_MS);
      const today = buckets.reduce((sum, b) => sum + (b.value ?? 0), 0);
      views.push({
        kind: 'total',
        metric,
        type,
        latest: { value: last.value, secondary: null, timestamp: last.timestamp },
        today,
        buckets,
        start,
        end,
      });
      continue;
    }

    const start = now - DAY_MS;
    const recent = own.filter((r) => r.timestamp.getTime() >= start);
    const end = Math.max(now, last.timestamp.getTime() + 1);
    const buckets = averageByBucket(recent, start, end, HOUR_MS / 2);
    const values = (recent.length ? recent : [last]).map((r) => r.value);
    views.push({
      kind: 'live',
      metric,
      type,
      latest: { value: last.value, secondary: null, timestamp: last.timestamp },
      stats: stats(values),
      buckets,
      start,
      end,
    });
  }

  return views;
}
