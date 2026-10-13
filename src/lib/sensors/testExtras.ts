import { useEffect, useState } from 'react';
import { mockSleep, mockSleepTrends } from '@/data/mocks';
import type { SleepSummary, SleepTrends } from '@/data/types';

// Test-data only (iOS, Phase 1): a sample night for the Sleep tab and Home's Sleep & Recovery card,
// added by the "Add 24h of Sample Data" dev buttons. Distance, floors and calories are never estimated.

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
