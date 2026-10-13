import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { AlertItem } from '@/data/types';
import { addAlert, clearAlerts, subscribeToAlerts } from '@/lib/alerts/alertHistory';
import { getAlertThresholdsUid, subscribeToAlertThresholds } from '@/lib/alerts/thresholds';
import { SENSOR_UID } from '@/lib/sensors/useSensorReadings';
import { useNow } from '@/lib/useNow';

// iOS only (no Android equivalent). Phase 2: the alert engine writes these; this hook only reads.
export function useNotifications() {
  const uid = getAlertThresholdsUid() ?? SENSOR_UID;
  const now = useNow(60 * 1000);
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [limits, setLimits] = useState({ hrMin: 50, hrMax: 120 });

  useEffect(
    () =>
      subscribeToAlerts(
        uid,
        (next) => {
          setAlerts(next);
          setError(null);
        },
        () => setError("Couldn't load your alerts."),
      ),
    [attempt, uid],
  );

  useEffect(
    () => subscribeToAlertThresholds(uid, (t) => setLimits({ hrMin: t.hrMin, hrMax: t.hrMax }), () => undefined),
    [uid],
  );

  const clearAll = () => {
    Alert.alert('Clear all alerts?', 'This removes every alert from this list.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: () => { void clearAlerts(uid).catch(() => setError("Couldn't clear your alerts.")); } },
    ]);
  };

  // Dev only: simulates what the Phase 2 alert engine will write, using the saved thresholds.
  const addTestAlert = useCallback(() => {
    const high = Math.random() < 0.6;
    const value = high ? limits.hrMax + 5 + Math.floor(Math.random() * 25) : limits.hrMin - 3 - Math.floor(Math.random() * 8);
    void addAlert(uid, {
      type: high ? 'HR_HIGH' : 'HR_LOW',
      value,
      message: high ? `Heart rate above ${limits.hrMax} BPM` : `Heart rate below ${limits.hrMin} BPM`,
      timestamp: Date.now(),
    });
  }, [limits, uid]);

  return {
    now,
    alerts: alerts ?? [],
    loading: alerts === null && !error,
    error,
    onClearAll: clearAll,
    onRetry: () => {
      setError(null);
      setAttempt((n) => n + 1);
    },
    onAddTestAlert: __DEV__ ? addTestAlert : undefined,
  };
}
