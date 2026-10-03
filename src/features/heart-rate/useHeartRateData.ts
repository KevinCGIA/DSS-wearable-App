import { useCallback } from 'react';
import type { RestingHrTrends } from '@/data/types';
import { addSampleDay, addSensorReading } from '@/lib/sensors/readings';
import { addSampleSleep } from '@/lib/sensors/testExtras';
import { SENSOR_UID, useLatestSensorReading, useSensorHistory } from '@/lib/sensors/useSensorReadings';
import { useNow } from '@/lib/useNow';

// Android: app/(auth)/heart-rate.tsx — same hooks; dev actions are addTestReading / addSampleData.
export function useHeartRateData() {
  const now = useNow(30 * 1000);
  const heartRate = useLatestSensorReading('heart_rate');
  const history = useSensorHistory('heart_rate', 24);

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
    heartRate,
    history,
    restingTrends: null as RestingHrTrends | null,
    onAddTestReading: __DEV__ ? addTestReading : undefined,
    onAddSampleData: __DEV__ ? addSampleData : undefined,
  };
}
