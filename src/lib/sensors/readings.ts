import type { ReadingSource, SensorReading, SensorType } from '@/data/types';

// In-memory stand-in for Android's services/sensors/readings.ts (Firestore
// users/{uid}/sensor_readings/{type}/readings). Same function names and arguments,
// so Phase 2 swaps this file for the ported Firestore version and nothing else changes.

const UNITS: Record<SensorType, string> = { heart_rate: 'bpm', steps: 'steps' };

const store: Record<SensorType, SensorReading[]> = { heart_rate: [], steps: [] };
const listeners = new Set<() => void>();
let nextId = 1;

function emit() {
  listeners.forEach((listener) => listener());
}

function insert(type: SensorType, reading: SensorReading) {
  const list = store[type];
  list.push(reading);
  list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function subscribeToLatestReading(
  _uid: string,
  type: SensorType,
  onReading: (reading: SensorReading | null) => void,
  _onError: (error: Error) => void,
): () => void {
  const listener = () => {
    const list = store[type];
    onReading(list.length ? list[list.length - 1] : null);
  };
  listeners.add(listener);
  listener();
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeToReadingsSince(
  _uid: string,
  type: SensorType,
  since: Date,
  onReadings: (readings: SensorReading[]) => void,
  _onError: (error: Error) => void,
): () => void {
  const listener = () => onReadings(store[type].filter((r) => r.timestamp >= since));
  listeners.add(listener);
  listener();
  return () => {
    listeners.delete(listener);
  };
}

export async function addSensorReading(
  _uid: string,
  type: SensorType,
  reading: {
    value: number;
    timestamp?: Date;
    deviceId?: string | null;
    deviceName?: string | null;
    source: ReadingSource;
  },
): Promise<void> {
  insert(type, {
    id: `r${nextId++}`,
    type,
    value: reading.value,
    unit: UNITS[type],
    timestamp: reading.timestamp ?? new Date(),
    deviceName: reading.deviceName ?? null,
    source: reading.source,
  });
  emit();
}

// Same as Android's addSampleDay: heart rate every 15 min, steps as an hourly running daily total.
export async function addSampleDay(_uid: string): Promise<void> {
  const now = Date.now();
  const start = now - 24 * 60 * 60 * 1000;
  const add = (type: SensorType, value: number, time: number) =>
    insert(type, {
      id: `r${nextId++}`,
      type,
      value,
      unit: UNITS[type],
      timestamp: new Date(time),
      deviceName: 'Sample data',
      source: 'manual',
    });

  for (let t = start; t <= now; t += 15 * 60 * 1000) {
    const hour = new Date(t).getHours();
    const asleep = hour < 7 || hour >= 23;
    add('heart_rate', (asleep ? 55 : 72) + Math.round(Math.random() * 18), t);
  }

  let dayTotal = 0;
  let day = new Date(start).getDate();
  for (let t = start; t <= now; t += 60 * 60 * 1000) {
    const date = new Date(t);
    if (date.getDate() !== day) {
      day = date.getDate();
      dayTotal = 0;
    }
    const hour = date.getHours();
    dayTotal += hour >= 7 && hour < 22 ? 200 + Math.round(Math.random() * 900) : 0;
    add('steps', dayTotal, t);
  }

  emit();
}
