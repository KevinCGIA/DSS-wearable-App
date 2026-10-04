// iOS structure (researcher / test-subject app). Android's tabs are home, heart-rate, fitness, sleep, settings;
// see claudephase2charter.md "Match the Android app" for the mapping.
export type TabKey = 'devices' | 'dashboard' | 'settings';

export const DEFAULT_TAB: TabKey = 'dashboard';

export type StackRoute =
  | 'profile'
  | 'heart-rate'
  | 'steps'
  | 'sleep'
  | 'alert-thresholds'
  | 'notifications'
  | 'preferences'
  | 'previews';

export type Navigation = {
  openTab: (tab: TabKey) => void;
  push: (route: StackRoute) => void;
  back: () => void;
};
