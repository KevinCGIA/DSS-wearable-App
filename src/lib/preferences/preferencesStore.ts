import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultPreferences } from '@/data/mocks';
import type { Preferences } from '@/data/types';

// Device-local, like iOS display settings. iOS only (Android has no Preferences screen).
const KEY = 'dss.preferences.v1';

export async function loadPreferences(): Promise<Preferences> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return defaultPreferences;
  return { ...defaultPreferences, ...(JSON.parse(raw) as Partial<Preferences>) };
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(preferences));
}
