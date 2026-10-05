// The app's structure on both platforms (2026-10-05): Dashboard | Devices | Activity | Settings.
// See claudephase2charter.md "App structure".
export type TabKey = 'dashboard' | 'devices' | 'activity' | 'settings';

export const DEFAULT_TAB: TabKey = 'dashboard';

export type StackRoute =
  | 'profile'
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
