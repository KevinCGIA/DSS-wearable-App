// Ported from Android services/sensors/trends.ts (feature/ble-connection) with the same maths.
import type { SensorReading } from '@/data/types';
import { isSameDay } from './time';

export type Bucket = {
  start: number;
  end: number;
  // null when there were no readings in this bucket (e.g. watch not worn)
  value: number | null;
};

export const HOUR_MS = 60 * 60 * 1000;

function makeBuckets(start: number, end: number, bucketMs: number): Bucket[] {
  const buckets: Bucket[] = [];
  for (let t = start; t < end; t += bucketMs) {
    buckets.push({ start: t, end: Math.min(t + bucketMs, end), value: null });
  }
  return buckets;
}

// Average per bucket; empty buckets stay null so charts show a gap, not a drop to zero.
export function averageByBucket(readings: SensorReading[], start: number, end: number, bucketMs: number): Bucket[] {
  const buckets = makeBuckets(start, end, bucketMs);
  const sums = new Array<number>(buckets.length).fill(0);
  const counts = new Array<number>(buckets.length).fill(0);

  for (const reading of readings) {
    const index = Math.floor((reading.timestamp.getTime() - start) / bucketMs);
    if (index >= 0 && index < buckets.length) {
      sums[index] += reading.value;
      counts[index] += 1;
    }
  }

  return buckets.map((bucket, i) => ({ ...bucket, value: counts[i] > 0 ? sums[i] / counts[i] : null }));
}

// Steps per bucket. Step readings are a running daily total, so each bucket gets the increase
// since the previous reading; on a new day the new day's total so far is counted instead.
export function stepsByBucket(readings: SensorReading[], start: number, end: number, bucketMs: number): Bucket[] {
  const buckets = makeBuckets(start, end, bucketMs).map((bucket) => ({ ...bucket, value: 0 }));

  readings.forEach((reading, i) => {
    const time = reading.timestamp.getTime();
    const previous = readings[i - 1];
    let steps: number;

    if (previous && isSameDay(previous.timestamp, reading.timestamp)) {
      steps = Math.max(reading.value - previous.value, 0);
    } else if (previous) {
      steps = reading.value;
    } else {
      const midnight = new Date(time);
      midnight.setHours(0, 0, 0, 0);
      steps = midnight.getTime() >= start ? reading.value : 0;
    }

    const index = Math.floor((time - start) / bucketMs);
    if (index >= 0 && index < buckets.length) buckets[index].value += steps;
  });

  return buckets;
}

// Android SensorTrendChart helpers: round the axis up, and label every 6 hours on the hour.
export function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

export function sixHourTicks(start: number, end: number): number[] {
  const first = new Date(start);
  first.setMinutes(0, 0, 0);
  first.setHours(first.getHours() + 1);
  while (first.getHours() % 6 !== 0) first.setHours(first.getHours() + 1);
  const ticks: number[] = [];
  for (let t = first.getTime(); t <= end; t += 6 * HOUR_MS) ticks.push(t);
  return ticks;
}

export function formatHour(time: number): string {
  const hours = new Date(time).getHours();
  const suffix = hours < 12 ? 'AM' : 'PM';
  return `${hours % 12 === 0 ? 12 : hours % 12} ${suffix}`;
}
