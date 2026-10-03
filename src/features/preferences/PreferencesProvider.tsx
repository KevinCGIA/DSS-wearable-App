import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultPreferences } from '@/data/mocks';
import type { Preferences } from '@/data/types';
import { loadPreferences, savePreferences } from '@/lib/preferences/preferencesStore';
import { applyTextScale } from '@/theme';

type PreferencesContextValue = {
  preferences: Preferences;
  loaded: boolean;
  save: (next: Preferences) => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// Wraps the whole app. Consumers (RootNavigator) re-render when preferences change,
// which picks up the rescaled `type` tokens everywhere below them.
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadPreferences()
      .catch(() => defaultPreferences)
      .then((stored) => {
        if (cancelled) return;
        applyTextScale(stored.textScale);
        setPreferences(stored);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (next: Preferences) => {
    await savePreferences(next);
    applyTextScale(next.textScale);
    setPreferences(next);
  }, []);

  const value = useMemo(() => ({ preferences, loaded, save }), [preferences, loaded, save]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider');
  return context;
}
