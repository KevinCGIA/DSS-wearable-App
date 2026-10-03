import { useCallback } from 'react';
import { addSampleDay, addSensorReading } from '@/lib/sensors/readings';
import { SENSOR_UID, useLatestSensorReading, useSensorHistory } from '@/lib/sensors/useSensorReadings';
import { isSameDay } from '@/lib/time';
import { useNow } from '@/lib/useNow';

// Android: app/(auth)/fitness.tsx — same hooks; dev actions are addTestSteps / addSampleData.
export function useFitnessData() {
  const now = useNow(60 * 1000);
  const steps = useLatestSensorReading('steps');
  const history = useSensorHistory('steps', 24);
  const reading = steps.reading;

  const addTestSteps = useCallback(() => {
    const today = reading && isSameDay(reading.timestamp, new Date()) ? reading.value : 0;
    addSensorReading(SENSOR_UID, 'steps', {
      value: today + 200 + Math.floor(Math.random() * 600),
      source: 'manual',
      deviceName: 'Test data',
    });
  }, [reading]);

  const addSampleData = useCallback(() => {
    addSampleDay(SENSOR_UID);
  }, []);

  return {
    now,
    steps,
    history,
    onAddTestSteps: __DEV__ ? addTestSteps : undefined,
    onAddSampleData: __DEV__ ? addSampleData : undefined,
  };
}
