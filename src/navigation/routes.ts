// iOS structure (researcher / test-subject app). Android's tabs are home, heart-rate, fitness, sleep, settings.
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
  | 'add-device'
  | 'device-detail'
  | 'previews';

export type Navigation = {
  openTab: (tab: TabKey) => void;
  push: (route: StackRoute) => void;
  back: () => void;
};
