import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { mockAlertThresholds } from '@/data/mocks';
import type { AlertThresholds } from '@/data/types';
import { saveAlertThresholds, subscribeToAlertThresholds, validateThresholds } from '@/lib/alerts/thresholds';
import { SENSOR_UID } from '@/lib/sensors/useSensorReadings';

type Notice = { tone: 'success' | 'error'; message: string };

const same = (a: AlertThresholds, b: AlertThresholds) =>
  a.enabled === b.enabled && a.hrMin === b.hrMin && a.hrMax === b.hrMax;

// iOS only (no Android equivalent). Phase 2: the same calls hit users/{uid}/settings/alerts.
export function useAlertThresholds(onBack: () => void) {
  const [saved, setSaved] = useState<AlertThresholds | null>(null);
  const [draft, setDraft] = useState<AlertThresholds>(mockAlertThresholds);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [attempt, setAttempt] = useState(0);
  const seeded = useRef(false);

  useEffect(
    () =>
      subscribeToAlertThresholds(
        SENSOR_UID,
        (thresholds) => {
          setSaved(thresholds);
          if (!seeded.current) {
            seeded.current = true;
            setDraft(thresholds);
          }
          setLoadError(null);
        },
        () => setLoadError("Couldn't load your alert settings."),
      ),
    [attempt],
  );

  const update = (patch: Partial<AlertThresholds>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setNotice(null);
  };

  const dirty = saved !== null && !same(draft, saved);
  const validationError = validateThresholds(draft);

  const save = async () => {
    if (validationError) return;
    setSaving(true);
    try {
      await saveAlertThresholds(SENSOR_UID, draft);
      setNotice({ tone: 'success', message: 'Alert thresholds saved.' });
    } catch {
      setNotice({ tone: 'error', message: "Couldn't save your alert thresholds. Try again." });
    } finally {
      setSaving(false);
    }
  };

  const back = useCallback(() => {
    if (!dirty) {
      onBack();
      return;
    }
    Alert.alert('Discard changes?', "Your new thresholds haven't been saved.", [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onBack },
    ]);
  }, [dirty, onBack]);

  return {
    draft,
    loading: saved === null && !loadError,
    loadError,
    saving,
    dirty,
    validationError,
    notice,
    onSetEnabled: (enabled: boolean) => update({ enabled }),
    onChangeMin: (hrMin: number) => update({ hrMin }),
    onChangeMax: (hrMax: number) => update({ hrMax }),
    onSave: save,
    onRetry: () => {
      setLoadError(null);
      setAttempt((n) => n + 1);
    },
    onBack: back,
  };
}
