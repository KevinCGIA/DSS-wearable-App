import React from 'react';
import { mockProfile } from '@/data/mocks';
import type { PreviewEntry } from '@/features/previews/types';
import { SettingsScreen } from './SettingsScreen';
import type { SettingsScreenProps } from './SettingsScreen';

const noop = () => undefined;

const base = (): SettingsScreenProps => ({
  bottomInset: 0,
  profile: mockProfile,
  profileLoading: false,
  onOpenProfile: noop,
  onOpenAlertThresholds: noop,
  onOpenNotifications: noop,
  onOpenPreferences: noop,
  onLogout: noop,
  onOpenPreviews: noop,
});

export const settingsPreview: PreviewEntry = {
  title: 'Settings',
  group: 'Screens',
  states: [
    { label: 'Default', render: () => <SettingsScreen {...base()} /> },
    { label: 'Profile loading', render: () => <SettingsScreen {...base()} profile={null} profileLoading /> },
    { label: 'Release build (no Previews)', render: () => <SettingsScreen {...base()} onOpenPreviews={undefined} /> },
  ],
};
