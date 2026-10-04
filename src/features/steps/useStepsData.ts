import { useCallback } from 'react';
import { useDeviceFilter } from '@/features/dashboard/DeviceFilterProvider';
import { useShowingLabel } from '@/features/dashboard/useShowingLabel';
import { filterHistory, filterLatest } from '@/lib/sensors/filterReadings';
import { addSampleDay, addSensorReading } from '@/lib/sensors/readings';
import { addSampleSleep } from '@/lib/sensors/testExtras';
import { SENSOR_UID, useLatestSensorReading, useSensorHistory } from '@/lib/sensors/useSensorReadings';
import { isSameDay } from '@/lib/time';
import { useNow } from '@/lib/useNow';

// Android: app/(auth)/fitness.tsx — same hooks; dev actions are addTestSteps / addSampleData.
// iOS: a pushed "Steps" detail page from the Dashboard that follows its device filter.
export function useStepsData() {
  const now = useNow(60 * 1000);
  const latestAll = useLatestSensorReading('steps');
  const historyAll = useSensorHistory('steps', 24);
  const { deviceId } = useDeviceFilter();
  const showing = useShowingLabel(deviceId);
  const latestReading = latestAll.reading;

  // Test steps add to the overall running total, like Android's addTestSteps.
  const addTestSteps = useCallback(() => {
    const today = latestReading && isSameDay(latestReading.timestamp, new Date()) ? latestReading.value : 0;
    addSensorReading(SENSOR_UID, 'steps', {
      value: today + 200 + Math.floor(Math.random() * 600),
      source: 'manual',
      deviceName: 'Test data',
    });
  }, [latestReading]);

  const addSampleData = useCallback(() => {
    addSampleDay(SENSOR_UID);
    addSampleSleep();
  }, []);

  return {
    now,
    steps: filterLatest(latestAll, historyAll, deviceId),
    history: filterHistory(historyAll, deviceId),
    showing,
    onAddTestSteps: __DEV__ ? addTestSteps : undefined,
    onAddSampleData: __DEV__ ? addSampleData : undefined,
  };
}
