import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mockProfile } from '@/data/mocks';
import type { UserProfile } from '@/data/types';
import { useBle } from '@/features/devices/BleProvider';
import { useProfile } from '@/features/profile/ProfileProvider';
import { testActivityFrom, useSampleSleep } from '@/lib/sensors/testExtras';
import { useLatestSensorReading, useSensorHistory } from '@/lib/sensors/useSensorReadings';
import { useNow } from '@/lib/useNow';
import { restingRangeFrom } from './homeModel';

const REFRESH_MS = 1200;

// Same shared sources as the other screens: useBle() (Devices/Settings), the profile (Profile/Settings)
// and the readings store (Heart Rate/Fitness). Phase 2 swaps those providers, not this hook.
export function useHomeData(displayName: string) {
  const now = useNow(30 * 1000);
  const ble = useBle();
  const { profile: loadedProfile, loading: profileLoading } = useProfile();
  const heartRate = useLatestSensorReading('heart_rate');
  const heartRateHistory = useSensorHistory('heart_rate', 24);
  const steps = useLatestSensorReading('steps');
  const sampleSleep = useSampleSleep();
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const { connection, pairedDevices, connect } = ble;

  // Connected: sync (refresh the readings). Failed: retry the most recent paired device, like auto-connect.
  const onRefresh = useCallback(() => {
    if (connection.status === 'connected') {
      if (timer.current) clearTimeout(timer.current);
      setRefreshing(true);
      timer.current = setTimeout(() => setRefreshing(false), REFRESH_MS);
      return;
    }
    const last = pairedDevices[0];
    if (connection.status === 'disconnected' && last) {
      connect({ id: last.deviceId, name: last.name });
    }
  }, [connection.status, pairedDevices, connect]);

  const profile = useMemo<UserProfile>(
    () => loadedProfile ?? { ...mockProfile, name: displayName },
    [loadedProfile, displayName],
  );

  return {
    now,
    profile,
    profileLoading,
    connection,
    refreshing: refreshing && connection.status === 'connected',
    heartRate,
    restingRange: restingRangeFrom(heartRateHistory),
    steps,
    activity: testActivityFrom(steps.reading, now),
    sleep: sampleSleep?.sleep ?? null,
    onRefresh,
  };
}
