import { useEffect, useRef, useState } from 'react';
import type { AlertThresholds } from '@/data/types';
import {
  DEFAULT_ALERT_THRESHOLDS,
  getAlertThresholdsUid,
  saveAlertThresholds,
  subscribeToAlertThresholds,
  validateThresholds,
} from '@/lib/alerts/thresholds';
import { useUnsavedChangesGuard } from '@/navigation/unsavedChanges';

type Notice = { tone: 'success' | 'error'; message: string };

const same = (a: AlertThresholds, b: AlertThresholds) =>
  a.enabled === b.enabled && a.hrMin === b.hrMin && a.hrMax === b.hrMax;

// iOS only (no Android equivalent). Phase 2: the same calls hit users/{uid}/settings/alerts.
export function useAlertThresholds(onBack: () => void) {
  const [saved, setSaved] = useState<AlertThresholds | null>(null);
  const [draft, setDraft] = useState<AlertThresholds>({ ...DEFAULT_ALERT_THRESHOLDS });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [attempt, setAttempt] = useState(0);
  const seeded = useRef(false);

  useEffect(
    () => {
      const uid = getAlertThresholdsUid();
      if (!uid) {
        setLoadError("Couldn't load your alert settings.");
        return () => undefined;
      }
      return subscribeToAlertThresholds(
        uid,
        (thresholds) => {
          setSaved(thresholds);
          if (!seeded.current) {
            seeded.current = true;
            setDraft(thresholds);
          }
          setLoadError(null);
        },
        () => setLoadError("Couldn't load your alert settings."),
      );
    },
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
    const uid = getAlertThresholdsUid();
    if (!uid) {
      setNotice({ tone: 'error', message: "Couldn't save your alert thresholds. Try again." });
      return;
    }
    setSaving(true);
    try {
      await saveAlertThresholds(uid, draft);
      setNotice({ tone: 'success', message: 'Alert thresholds saved.' });
    } catch {
      setNotice({ tone: 'error', message: "Couldn't save your alert thresholds. Try again." });
    } finally {
      setSaving(false);
    }
  };

  useUnsavedChangesGuard(dirty, "Your new thresholds haven't been saved.");

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
    onBack,
  };
}
