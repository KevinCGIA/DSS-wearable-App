import type { HistoryState, LatestReadingState } from '@/data/types';

// Device filter for the Dashboard and its detail pages. `null` = all devices (test data included);
// a deviceId keeps only that device's readings (test data has no device, so it drops out).

export function filterHistory(history: HistoryState, deviceId: string | null): HistoryState {
  if (!deviceId) return history;
  return { ...history, readings: history.readings.filter((r) => r.deviceId === deviceId) };
}

export function filterLatest(
  latest: LatestReadingState,
  history: HistoryState,
  deviceId: string | null,
): LatestReadingState {
  if (!deviceId) return latest;
  if (latest.reading?.deviceId === deviceId) return latest;
  const own = history.readings.filter((r) => r.deviceId === deviceId);
  return { ...latest, reading: own.length ? own[own.length - 1] : null };
}
