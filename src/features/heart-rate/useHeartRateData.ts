import { useCallback, useState } from 'react';
import { emptyHistory, emptyLatest, heartRateHistory, heartRateLatest } from '@/data/mocks';
import type { HistoryState, LatestReadingState, RestingHrTrends } from '@/data/types';
import { useNow } from '@/lib/useNow';

type HeartRateData = { heartRate: LatestReadingState; history: HistoryState };

const DAY_MS = 24 * 60 * 60 * 1000;

// Phase 2: useLatestSensorReading('heart_rate') + useSensorHistory('heart_rate', 24) from Android's services/sensors.
// Dev actions mirror Android's addTestReading / addSampleData (app/(auth)/heart-rate.tsx), kept in memory here.
export function useHeartRateData() {
  const now = useNow(30 * 1000);
  const [data, setData] = useState<HeartRateData>(() => ({ heartRate: emptyLatest, history: emptyHistory() }));

  const addTestReading = useCallback(() => {
    setData((prev) => {
      const heartRate = heartRateLatest(60 + Math.floor(Math.random() * 40), 0);
      const reading = heartRate.reading!;
      const end = reading.timestamp.getTime();
      return {
        heartRate,
        history: {
          ...prev.history,
          readings: [...prev.history.readings, { ...reading, id: `test-${end}` }],
          start: end - DAY_MS,
          end,
        },
      };
    });
  }, []);

  const addSampleData = useCallback(() => {
    const history = heartRateHistory();
    const last = history.readings[history.readings.length - 1];
    setData({ history, heartRate: last ? heartRateLatest(last.value, 30 * 1000) : emptyLatest });
  }, []);

  return {
    now,
    heartRate: data.heartRate,
    history: data.history,
    restingTrends: null as RestingHrTrends | null,
    onAddTestReading: __DEV__ ? addTestReading : undefined,
    onAddSampleData: __DEV__ ? addSampleData : undefined,
  };
}
