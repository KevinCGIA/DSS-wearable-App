import { useMemo } from 'react';
import { useConnectionLog, useConnectionLogError } from '@/lib/devices/connectionLog';
import { useSensorHistory } from '@/lib/sensors/useSensorReadings';
import { useNow } from '@/lib/useNow';
import { useBle } from './BleProvider';
import { buildDevicesModel } from './deviceModel';

// Device history window for the stats (sessions, totals, success rate).
const HISTORY_HOURS = 30 * 24;

export function useDevicesData() {
  const ble = useBle();
  // Every 5 s so session time, "last reading" and Not responding stay current.
  const now = useNow(5 * 1000);
  const events = useConnectionLog();
  const logError = useConnectionLogError();
  const heartRate = useSensorHistory('heart_rate', HISTORY_HOURS);
  const steps = useSensorHistory('steps', 24);

  const model = useMemo(
    () =>
      buildDevicesModel({
        connections: ble.connections,
        pairedDevices: ble.pairedDevices,
        events,
        heartRate: heartRate.readings,
        steps: steps.readings,
        pausedDevices: ble.pausedDevices,
        now,
      }),
    [ble.connections, ble.pairedDevices, ble.pausedDevices, events, heartRate.readings, steps.readings, now],
  );

  return {
    ble,
    now,
    model,
    loading: heartRate.loading,
    error: heartRate.error ?? steps.error ?? logError,
  };
}
