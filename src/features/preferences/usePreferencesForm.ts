import { useEffect, useState } from 'react';
import type { Preferences } from '@/data/types';
import { useUnsavedChangesGuard } from '@/navigation/unsavedChanges';
import { usePreferences } from './PreferencesProvider';

const same = (a: Preferences, b: Preferences) =>
  a.textScale === b.textScale && a.units === b.units && a.notifications === b.notifications;

// iOS only. Phase 2: the alert engine reads `notifications` before scheduling a local notification.
export function usePreferencesForm(onBack: () => void) {
  const { preferences, loaded, save } = usePreferences();
  const [draft, setDraft] = useState<Preferences>(preferences);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (loaded) setDraft(preferences);
  }, [loaded, preferences]);

  const dirty = !same(draft, preferences);
  useUnsavedChangesGuard(dirty, "Your preferences haven't been saved.");

  const update = (patch: Partial<Preferences>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setNotice(null);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await save(draft);
      setNotice({ tone: 'success', message: 'Preferences saved.' });
    } catch {
      setNotice({ tone: 'error', message: "Couldn't save your preferences. Try again." });
    } finally {
      setSaving(false);
    }
  };

  return {
    draft,
    saving,
    dirty,
    notice,
    onChangeTextScale: (textScale: Preferences['textScale']) => update({ textScale }),
    onChangeUnits: (units: Preferences['units']) => update({ units }),
    onSetNotifications: (notifications: boolean) => update({ notifications }),
    onSave,
    onBack,
  };
}
