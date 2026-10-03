import { useEffect, useState } from 'react';
import { mockSleep, mockSleepTrends, noActivityExtras } from '@/data/mocks';
import type { DailyActivityExtras, SensorReading, SleepSummary, SleepTrends } from '@/data/types';
import { isSameDay } from '@/lib/time';

// Test-data only (iOS, Phase 1). Android has no source for distance, floors, calories or sleep,
// so real readings keep showing "--". When the steps come from the dev buttons (source 'manual'),
// these are derived from those same steps so Home never shows 0 steps next to 4.8 km.

const STRIDE_KM = 0.000762;
const STEPS_PER_FLOOR = 700;
const KCAL_PER_STEP = 0.045;

export function testActivityFrom(steps: SensorReading | null, now: number): DailyActivityExtras {
  if (!steps || steps.source !== 'manual') return noActivityExtras;
  const today = isSameDay(steps.timestamp, new Date(now)) ? steps.value : 0;
  return {
    distanceKm: Math.round(today * STRIDE_KM * 10) / 10,
    floors: Math.floor(today / STEPS_PER_FLOOR),
    activeCalories: Math.round(today * KCAL_PER_STEP),
    calorieTarget: noActivityExtras.calorieTarget,
  };
}

let sampleSleep: { sleep: SleepSummary; trends: SleepTrends } | null = null;
const listeners = new Set<() => void>();

// Called by the "Add 24h of Sample Data" dev buttons alongside Android's addSampleDay.
export function addSampleSleep() {
  sampleSleep = { sleep: mockSleep, trends: mockSleepTrends };
  listeners.forEach((listener) => listener());
}

export function useSampleSleep() {
  const [value, setValue] = useState(sampleSleep);
  useEffect(() => {
    const listener = () => setValue(sampleSleep);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return value;
}
