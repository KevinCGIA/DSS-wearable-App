import { useEffect, useState } from 'react';
import type { LatestReadingState } from '@/data/types';

// Preview only: simulates a connected watch streaming BPM every 2s.
export function useLiveHeartRate(start = 72): LatestReadingState {
  const [bpm, setBpm] = useState(start);
  const [timestamp, setTimestamp] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setBpm((prev) => Math.min(96, Math.max(64, prev + Math.round((Math.random() - 0.5) * 6))));
      setTimestamp(new Date());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return {
    reading: {
      id: 'live',
      type: 'heart_rate',
      value: bpm,
      unit: 'bpm',
      timestamp,
      deviceName: 'Galaxy Watch8',
      source: 'ble',
    },
    loading: false,
    error: null,
  };
}
