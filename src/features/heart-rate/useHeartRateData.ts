import { useCallback } from 'react';
import type { RestingHrTrends } from '@/data/types';
import { useDeviceFilter } from '@/features/dashboard/DeviceFilterProvider';
import { useShowingLabel } from '@/features/dashboard/useShowingLabel';
import { filterHistory, filterLatest } from '@/lib/sensors/filterReadings';
import { addSampleDay, addSensorReading } from '@/lib/sensors/readings';
import { addSampleSleep } from '@/lib/sensors/testExtras';
import { SENSOR_UID, useLatestSensorReading, useSensorHistory } from '@/lib/sensors/useSensorReadings';
import { useNow } from '@/lib/useNow';

// Android: app/(auth)/heart-rate.tsx — same hooks; dev actions are addTestReading / addSampleData.
// iOS: a pushed detail page from the Dashboard that follows its device filter.
export function useHeartRateData() {
  const now = useNow(30 * 1000);
  const latestAll = useLatestSensorReading('heart_rate');
  const historyAll = useSensorHistory('heart_rate', 24);
  const { deviceId } = useDeviceFilter();
  const showing = useShowingLabel(deviceId);

  const addTestReading = useCallback(() => {
    addSensorReading(SENSOR_UID, 'heart_rate', {
      value: 60 + Math.floor(Math.random() * 40),
      source: 'manual',
      deviceName: 'Test data',
    });
  }, []);

  const addSampleData = useCallback(() => {
    addSampleDay(SENSOR_UID);
    addSampleSleep();
  }, []);

  return {
    now,
    heartRate: filterLatest(latestAll, historyAll, deviceId),
    history: filterHistory(historyAll, deviceId),
    showing,
    restingTrends: null as RestingHrTrends | null,
    onAddTestReading: __DEV__ ? addTestReading : undefined,
    onAddSampleData: __DEV__ ? addSampleData : undefined,
  };
}
