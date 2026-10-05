import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ActivitySection } from './activityModel';

// Which source the Activity tab shows (kept while the app is open) and a pending
// "scroll to this section" request from a Dashboard link.
export type ScrollRequest = { section: ActivitySection; nonce: number };

type ActivityFocusValue = {
  selected: string | null;
  select: (key: string) => void;
  scrollRequest: ScrollRequest | null;
  // From the Dashboard: show this section, with this source selected when known.
  focus: (section: ActivitySection, source: string | null) => void;
  clearScrollRequest: () => void;
};

const ActivityFocusContext = createContext<ActivityFocusValue | null>(null);

export function ActivityFocusProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [scrollRequest, setScrollRequest] = useState<ScrollRequest | null>(null);

  const focus = useCallback((section: ActivitySection, source: string | null) => {
    if (source) setSelected(source);
    setScrollRequest({ section, nonce: Date.now() });
  }, []);
  const clearScrollRequest = useCallback(() => setScrollRequest(null), []);

  const value = useMemo(
    () => ({ selected, select: setSelected, scrollRequest, focus, clearScrollRequest }),
    [selected, scrollRequest, focus, clearScrollRequest],
  );
  return <ActivityFocusContext.Provider value={value}>{children}</ActivityFocusContext.Provider>;
}

export function useActivityFocus(): ActivityFocusValue {
  const context = useContext(ActivityFocusContext);
  if (!context) throw new Error('useActivityFocus must be used inside ActivityFocusProvider');
  return context;
}
