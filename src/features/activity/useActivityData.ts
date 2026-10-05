import { useCallback, useMemo } from 'react';
import { useBle } from '@/features/devices/BleProvider';
import { connectionsOf } from '@/features/devices/connections';
import { addSampleDay, addSensorReading } from '@/lib/sensors/readings';
import { addSampleSleep, useSampleSleep } from '@/lib/sensors/testExtras';
import { SENSOR_UID, useSensorHistory } from '@/lib/sensors/useSensorReadings';
import { isSameDay } from '@/lib/time';
import { useNow } from '@/lib/useNow';
import { useActivityFocus } from './ActivityFocusProvider';
import { buildActivity, TEST_SOURCE } from './activityModel';

// A week covers the daily steps chart and lists every source with recent data.
const WINDOW_HOURS = 7 * 24;

// Android: app/(auth)/heart-rate.tsx, fitness.tsx and sleep.tsx, merged and split by source.
// The device list is used only to name chips.
export function useActivityData() {
  const now = useNow(30 * 1000);
  const ble = useBle();
  const heartRate = useSensorHistory('heart_rate', WINDOW_HOURS);
  const steps = useSensorHistory('steps', WINDOW_HOURS);
  const sample = useSampleSleep();
  const { selected, select, scrollRequest, clearScrollRequest } = useActivityFocus();

  const names = useMemo(() => {
    const out: Record<string, string> = {};
    for (const d of ble.pairedDevices) out[d.deviceId] = d.name;
    for (const c of connectionsOf(ble)) if (c.deviceId && c.deviceName) out[c.deviceId] = c.deviceName;
    return out;
  }, [ble]);

  const view = useMemo(
    () =>
      buildActivity({
        now,
        heartRate: heartRate.readings,
        steps: steps.readings,
        names,
        includeTest: __DEV__,
        selected,
        // No device reports sleep yet; the dev sample night belongs to Test data.
        sleepFor: (key) => (__DEV__ && key === TEST_SOURCE && sample ? sample : null),
        // No source reports resting heart rate yet, and it's never estimated.
        restingTrendsFor: () => null,
      }),
    [now, heartRate.readings, steps.readings, names, selected, sample],
  );

  const addTestReading = useCallback(() => {
    addSensorReading(SENSOR_UID, 'heart_rate', {
      value: 60 + Math.floor(Math.random() * 40),
      source: 'manual',
      deviceName: 'Test data',
    });
    select(TEST_SOURCE);
  }, [select]);

  const addSampleData = useCallback(() => {
    addSampleDay(SENSOR_UID);
    addSampleSleep();
    select(TEST_SOURCE);
  }, [select]);

  // Test steps add to Test data's own running total for today (steps are a daily running total).
  const testStepsToday = useMemo(() => {
    const today = steps.readings.filter((r) => r.source === 'manual' && isSameDay(r.timestamp, new Date(now)));
    return today.length ? Math.max(...today.map((r) => r.value)) : 0;
  }, [steps.readings, now]);

  const addTestSteps = useCallback(() => {
    addSensorReading(SENSOR_UID, 'steps', {
      value: testStepsToday + 200 + Math.floor(Math.random() * 600),
      source: 'manual',
      deviceName: 'Test data',
    });
    select(TEST_SOURCE);
  }, [testStepsToday, select]);

  return {
    now,
    loading: heartRate.loading || steps.loading,
    error: heartRate.error ?? steps.error,
    view,
    scrollRequest,
    onSelect: select,
    onScrollHandled: clearScrollRequest,
    onAddTestReading: __DEV__ ? addTestReading : undefined,
    onAddSampleData: __DEV__ ? addSampleData : undefined,
    onAddTestSteps: __DEV__ ? addTestSteps : undefined,
  };
}
