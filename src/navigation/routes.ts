// Keys match the Android expo-router routes in app/(auth)/.
export type TabKey = 'home' | 'heart-rate' | 'fitness' | 'sleep' | 'settings';

export type StackRoute = 'profile' | 'devices' | 'alert-thresholds' | 'notifications' | 'preferences' | 'previews';

export type Navigation = {
  openTab: (tab: TabKey) => void;
  push: (route: StackRoute) => void;
  back: () => void;
};
