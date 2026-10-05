import type { SensorReading, SensorType } from '@/data/types';
import { deviceKey } from '../ble/deviceKey';
import type { ReadingBatch } from './readingBatches';

export function timestampMs(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') return value.toMillis();
  return null;
}

export function legacyReading(id: string, type: SensorType, data: Record<string, unknown>): SensorReading | null {
  const time = timestampMs(data.timestamp);
  if (time === null || typeof data.value !== 'number' || !Number.isFinite(data.value)) return null;
  return {
    id, type, value: data.value, unit: typeof data.unit === 'string' ? data.unit : type === 'heart_rate' ? 'bpm' : 'steps',
    timestamp: new Date(time),
    deviceId: typeof data.deviceId === 'string' ? deviceKey(data.platform === 'ios' ? 'ios' : 'android', data.deviceId) : null,
    deviceName: typeof data.deviceName === 'string' ? data.deviceName : null,
    source: data.source === 'manual' || data.source === 'test' ? 'test' : 'ble',
    resolution: 'representative',
  };
}

export function batchReadings(batch: ReadingBatch): SensorReading[] {
  return batch.samples.map((sample, index) => ({
    id: `${batch.id}:${index}`, type: batch.type, value: sample.v,
    unit: batch.type === 'heart_rate' ? 'bpm' : 'steps', timestamp: new Date(sample.t),
    deviceId: batch.source === 'test' ? null : deviceKey(batch.platform, batch.deviceId),
    deviceName: batch.deviceName, source: batch.source, resolution: 'sample',
  }));
}

export function mergeReadings(readings: SensorReading[]): SensorReading[] {
  const byId = new Map<string, SensorReading>();
  const full = new Set<string>();
  const key = (r: SensorReading) => `${r.type}:${r.deviceId}:${r.source}:${r.timestamp.getTime()}:${r.value}`;
  for (const reading of readings) {
    byId.set(reading.id, reading);
    if (reading.resolution !== 'representative') full.add(key(reading));
  }
  return [...byId.values()].filter((r) => r.resolution !== 'representative' || !full.has(key(r)))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
