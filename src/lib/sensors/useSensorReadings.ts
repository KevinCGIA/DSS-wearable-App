import { useEffect, useState } from 'react';
import type { HistoryState, LatestReadingState, SensorType } from '@/data/types';
import { useNow } from '@/lib/useNow';
import { subscribeToLatestReading, subscribeToReadingsSince } from './readings';

// Same hooks as Android's services/sensors/useLatestSensorReading.ts and useSensorHistory.ts.
// Phase 2: uid comes from getAuth().currentUser, as on Android.
export const SENSOR_UID = 'current-user';

export function useLatestSensorReading(type: SensorType): LatestReadingState {
  const [state, setState] = useState<LatestReadingState>({ reading: null, loading: true, error: null });

  useEffect(
    () =>
      subscribeToLatestReading(
        SENSOR_UID,
        type,
        (reading) => setState({ reading, loading: false, error: null }),
        () => setState({ reading: null, loading: false, error: "Couldn't load your latest reading." }),
      ),
    [type],
  );

  return state;
}

export function useSensorHistory(type: SensorType, hours: number): HistoryState {
  const now = useNow(60 * 1000);
  const start = now - hours * 60 * 60 * 1000;
  const [state, setState] = useState<Omit<HistoryState, 'start' | 'end'>>({ readings: [], loading: true, error: null });

  useEffect(
    () =>
      subscribeToReadingsSince(
        SENSOR_UID,
        type,
        new Date(start),
        (readings) => setState({ readings, loading: false, error: null }),
        () => setState({ readings: [], loading: false, error: "Couldn't load your history." }),
      ),
    [type, start],
  );

  // New readings can arrive after `now`. +1 ms keeps a reading stamped exactly at the window
  // end inside the last bucket (Android's windowEnd = max(end, latest) drops it).
  const latest = state.readings[state.readings.length - 1];
  const end = Math.max(now, latest ? latest.timestamp.getTime() + 1 : 0);

  return { ...state, start, end };
}
