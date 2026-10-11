import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mockProfile, mockScannedDevices } from '@/data/mocks';
import type { DailyActivityExtras, SensorReading, UserProfile } from '@/data/types';
import { sourceKeyOf } from '@/features/activity/activityModel';
import { buildVitals } from '@/features/activity/vitalsModel';
import type { VitalReadings } from '@/features/activity/vitalsModel';
import { VITAL_METRICS } from '@/lib/biometrics/metrics';
import { useBle } from '@/features/devices/BleProvider';
import { usePreferences } from '@/features/preferences/PreferencesProvider';
import { useProfile } from '@/features/profile/ProfileProvider';
import { useSampleSleep } from '@/lib/sensors/testExtras';
import { useLatestSensorReading, useSensorHistories, useSensorHistory } from '@/lib/sensors/useSensorReadings';
import { useNow } from '@/lib/useNow';
import { connectionsOf } from '@/features/devices/connections';
import { restingRangeFrom } from './dashboardModel';
import type { DeviceSummary } from './dashboardModel';

const REFRESH_MS = 1200;
const VITAL_TYPES = VITAL_METRICS.flatMap((m) => m.types);
// On their own cards (Today's Activity, Active Calories) rather than the Vitals card
const ACTIVITY_TOTALS = ['energy', 'distance'];

// The old Home data, unchanged: useBle(), the profile and the readings store. Phase 2 swaps those providers.
export function useDashboardData(displayName: string) {
  const now = useNow(30 * 1000);
  const ble = useBle();
  const { profile: loadedProfile, loading: profileLoading } = useProfile();
  const heartRate = useLatestSensorReading('heart_rate');
  const heartRateHistory = useSensorHistory('heart_rate', 24);
  const steps = useLatestSensorReading('steps');
  const stepsHistory = useSensorHistory('steps', 24);
  const sampleSleep = useSampleSleep();
  // 48 h so today's first running-total reading has yesterday's to compare with
  const vitalsHistory = useSensorHistories(VITAL_TYPES, 48);
  const { units } = usePreferences().preferences;
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

  // One summary per connected/connecting device. Last sync = that device's newest reading.
  const devices = useMemo<DeviceSummary[]>(() => {
    const newest = (id: string) => {
      const times = [...heartRateHistory.readings, ...stepsHistory.readings]
        .filter((r) => r.deviceId === id)
        .map((r) => r.timestamp.getTime());
      return times.length ? Math.max(...times) : null;
    };
    return connectionsOf(ble)
      .filter((c) => c.status !== 'disconnected' && c.deviceId)
      .map((c) => {
        const id = c.deviceId as string;
        return {
          deviceId: id,
          name: c.deviceName ?? 'Unknown device',
          status: c.status,
          rssi: c.rssi ?? mockScannedDevices.find((d) => d.id === id)?.rssi ?? null,
          batteryLevel: c.batteryLevel,
          lastSync: newest(id),
        };
      });
  }, [ble, heartRateHistory.readings, stepsHistory.readings]);

  // Every source together: running totals are summed per device, the rest show the newest value.
  // Test data counts only in development.
  const { vitals, activity, vitalsSource } = useMemo(() => {
    const usable: VitalReadings = {};
    let newest: SensorReading | null = null;
    for (const [type, list] of Object.entries(vitalsHistory.readings) as [keyof VitalReadings, SensorReading[]][]) {
      const own = list.filter((r) => __DEV__ || r.source === 'ble');
      usable[type] = own;
      const last = own[own.length - 1];
      if (last && !ACTIVITY_TOTALS.includes(type) && (!newest || newest.timestamp < last.timestamp)) newest = last;
    }
    const views = buildVitals(usable, now);
    const today = (id: string) => {
      const view = views.find((v) => v.metric.id === id);
      return view?.kind === 'total' ? view.today : null;
    };
    const distance = today('distance');
    const energy = today('energy');
    const extras: DailyActivityExtras = {
      distanceKm: distance === null ? null : distance / 1000,
      floors: null,
      activeCalories: energy === null ? null : Math.round(energy),
    };
    return {
      vitals: views.filter((v) => !ACTIVITY_TOTALS.includes(v.metric.id)),
      activity: extras,
      vitalsSource: newest ? sourceKeyOf(newest) : null,
    };
  }, [vitalsHistory.readings, now]);

  const profile = useMemo<UserProfile>(
    () => loadedProfile ?? { ...mockProfile, name: displayName },
    [loadedProfile, displayName],
  );

  return {
    now,
    profile,
    profileLoading,
    connection,
    devices,
    refreshing: refreshing && connection.status === 'connected',
    heartRate,
    heartRateHistory,
    restingRange: restingRangeFrom(heartRateHistory),
    steps,
    stepsHistory,
    // Distance and calories only when a device reports them (RSC total distance, HR energy
    // expended); floors have no BLE source, so they stay "--".
    activity,
    vitals,
    vitalsSource,
    units,
    sleep: sampleSleep?.sleep ?? null,
    sleepTrends: sampleSleep?.trends ?? null,
    onRefresh,
  };
}
