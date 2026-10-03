import { useSampleSleep } from '@/lib/sensors/testExtras';

// No sleep data source exists yet (Android's Sleep tab is a placeholder), so the real flow is empty.
// Test only: "Add 24h of Sample Data" fills a sample night. Phase 2: the shared sleep source.
export function useSleepData() {
  const sample = useSampleSleep();
  return {
    sleep: sample?.sleep ?? null,
    trends: sample?.trends ?? null,
    loading: false,
    error: null as string | null,
  };
}
