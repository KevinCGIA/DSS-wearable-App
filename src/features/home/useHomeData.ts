import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { disconnectedConnection, mockProfile, noActivityExtras } from '@/data/mocks';
import type { UserProfile } from '@/data/types';
import { useLatestSensorReading, useSensorHistory } from '@/lib/sensors/useSensorReadings';
import { useNow } from '@/lib/useNow';
import { restingRangeFrom } from './homeModel';

const REFRESH_MS = 1200;

// Heart rate and steps come from the shared readings store (same hooks as Android, mock store in Phase 1).
// Phase 2: also swap the connection/profile mocks for useBle() and loadProfilePicture.
export function useHomeData(displayName: string) {
  const now = useNow(30 * 1000);
  const heartRate = useLatestSensorReading('heart_rate');
  const heartRateHistory = useSensorHistory('heart_rate', 24);
  const steps = useLatestSensorReading('steps');
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onRefresh = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setRefreshing(true);
    timer.current = setTimeout(() => setRefreshing(false), REFRESH_MS);
  }, []);

  const profile = useMemo<UserProfile>(() => ({ ...mockProfile, name: displayName }), [displayName]);

  return {
    now,
    profile,
    profileLoading: false,
    connection: disconnectedConnection,
    refreshing,
    heartRate,
    restingRange: restingRangeFrom(heartRateHistory),
    steps,
    activity: noActivityExtras,
    sleep: null,
    onRefresh,
  };
}
