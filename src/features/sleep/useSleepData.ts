import type { SleepSummary, SleepTrends } from '@/data/types';

// No sleep data source exists yet (Android's Sleep tab is a placeholder), so the real flow is empty.
// Phase 2: replace with the shared sleep source once the Android team adds one.
export function useSleepData() {
  return {
    sleep: null as SleepSummary | null,
    trends: null as SleepTrends | null,
    loading: false,
    error: null as string | null,
  };
}
