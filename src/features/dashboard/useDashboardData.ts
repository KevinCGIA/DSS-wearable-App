import { useEffect, useMemo } from 'react';
import { mockProfile, mockScannedDevices, noActivityExtras } from '@/data/mocks';
import type { UserProfile } from '@/data/types';
import { useBle } from '@/features/devices/BleProvider';
import { usePreferences } from '@/features/preferences/PreferencesProvider';
import { useProfile } from '@/features/profile/ProfileProvider';
import { filterHistory, filterLatest } from '@/lib/sensors/filterReadings';
import { useSampleSleep } from '@/lib/sensors/testExtras';
import { useLatestSensorReading, useSensorHistory } from '@/lib/sensors/useSensorReadings';
import { useNow } from '@/lib/useNow';
import { connectedDevicesFrom, restingRangeFrom } from './dashboardModel';
import { useDeviceFilter } from './DeviceFilterProvider';

// Same shared sources as before (useBle, profile, readings store); Phase 2 swaps those providers.
export function useDashboardData(displayName: string) {
  const now = useNow(30 * 1000);
  const ble = useBle();
  const { profile: loadedProfile, loading: profileLoading } = useProfile();
  const { units } = usePreferences().preferences;
  const { deviceId, setDeviceId } = useDeviceFilter();
  const sampleSleep = useSampleSleep();

  const heartRateAll = useLatestSensorReading('heart_rate');
  const heartRateHistoryAll = useSensorHistory('heart_rate', 24);
  const stepsAll = useLatestSensorReading('steps');
  const stepsHistoryAll = useSensorHistory('steps', 24);

  // Phase 1 BLE holds one connection; Phase 2 Step B item 10 passes every device's state here.
  // RSSI: scan result if we have one, else the mock value (Phase 2: readRSSI while connected).
  const devices = useMemo(
    () =>
      connectedDevicesFrom([ble.connection], (id) => {
        const seen = ble.devices.find((d) => d.id === id) ?? mockScannedDevices.find((d) => d.id === id);
        return seen ? seen.rssi : null;
      }),
    [ble.connection, ble.devices],
  );

  // The filter only makes sense with two or more devices; fall back to all devices otherwise.
  useEffect(() => {
    if (deviceId && devices.length < 2) setDeviceId(null);
  }, [deviceId, devices.length, setDeviceId]);

  const heartRateHistory = filterHistory(heartRateHistoryAll, deviceId);
  const stepsHistory = filterHistory(stepsHistoryAll, deviceId);

  const profile = useMemo<UserProfile>(
    () => loadedProfile ?? { ...mockProfile, name: displayName },
    [loadedProfile, displayName],
  );

  return {
    now,
    profile,
    profileLoading,
    devices,
    filterDeviceId: deviceId,
    heartRate: filterLatest(heartRateAll, heartRateHistoryAll, deviceId),
    heartRateHistory,
    restingRange: restingRangeFrom(heartRateHistory),
    steps: filterLatest(stepsAll, stepsHistoryAll, deviceId),
    stepsHistory,
    sleep: sampleSleep?.sleep ?? null,
    // No source for distance, floors or calories (Android has none): always "--" until Phase 2 data exists.
    activity: noActivityExtras,
    units,
    onChangeFilter: setDeviceId,
  };
}
