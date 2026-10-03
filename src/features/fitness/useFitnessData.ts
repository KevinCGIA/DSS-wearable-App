import { useCallback, useState } from 'react';
import { emptyHistory, emptyLatest, stepsHistory, stepsLatest } from '@/data/mocks';
import type { HistoryState, LatestReadingState } from '@/data/types';
import { isSameDay } from '@/lib/time';
import { useNow } from '@/lib/useNow';

type StepsData = { steps: LatestReadingState; history: HistoryState };

// Phase 2: useLatestSensorReading('steps') + useSensorHistory('steps', 24) from Android's services/sensors.
// The dev actions mirror Android's addTestSteps / addSampleData (app/(auth)/fitness.tsx), kept in memory here.
export function useFitnessData() {
  const now = useNow(60 * 1000);
  const [data, setData] = useState<StepsData>(() => ({ steps: emptyLatest, history: emptyHistory() }));

  const addTestSteps = useCallback(() => {
    setData((prev) => {
      const current = prev.steps.reading;
      const today = current && isSameDay(current.timestamp, new Date()) ? current.value : 0;
      const steps = stepsLatest(today + 200 + Math.floor(Math.random() * 600), 0);
      const reading = steps.reading!;
      const end = reading.timestamp.getTime();
      return {
        steps,
        history: {
          ...prev.history,
          readings: [...prev.history.readings, { ...reading, id: `test-${end}` }],
          start: end - 24 * 60 * 60 * 1000,
          end,
        },
      };
    });
  }, []);

  const addSampleData = useCallback(() => {
    const history = stepsHistory();
    const last = history.readings[history.readings.length - 1];
    setData({ history, steps: stepsLatest(last ? last.value : 0, 5 * 60 * 1000) });
  }, []);

  return {
    now,
    steps: data.steps,
    history: data.history,
    onAddTestSteps: __DEV__ ? addTestSteps : undefined,
    onAddSampleData: __DEV__ ? addSampleData : undefined,
  };
}
