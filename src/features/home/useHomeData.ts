import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  disconnectedConnection,
  emptyHistory,
  emptyLatest,
  mockProfile,
  noActivityExtras,
} from '@/data/mocks';
import type { UserProfile } from '@/data/types';
import { useNow } from '@/lib/useNow';
import { restingRangeFrom } from './homeModel';

const REFRESH_MS = 1200;

// Phase 2: swap the mocks for useBle().connection, useLatestSensorReading('heart_rate' | 'steps'),
// useSensorHistory('heart_rate', 24) and Android's loadProfilePicture.
export function useHomeData(displayName: string) {
  const now = useNow(30 * 1000);
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
    heartRate: emptyLatest,
    restingRange: restingRangeFrom(emptyHistory()),
    steps: emptyLatest,
    activity: noActivityExtras,
    sleep: null,
    onRefresh,
  };
}
