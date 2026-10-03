import React from 'react';
import {
  connectedConnection,
  connectionIn,
  disconnectedConnection,
  failedConnection,
  mockPairedDevices,
  mockProfile,
} from '@/data/mocks';
import type { PreviewEntry } from '@/features/previews/types';
import { SettingsScreen } from './SettingsScreen';
import type { SettingsScreenProps } from './SettingsScreen';

const noop = () => undefined;

const base = (): SettingsScreenProps => ({
  bottomInset: 0,
  now: Date.now(),
  profile: mockProfile,
  profileLoading: false,
  connection: disconnectedConnection,
  pairedDevices: mockPairedDevices,
  autoConnect: true,
  onOpenProfile: noop,
  onConnect: noop,
  onDisconnect: noop,
  onForgetDevice: noop,
  onSetAutoConnect: noop,
  onOpenDevices: noop,
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
    { label: 'Connected', render: () => <SettingsScreen {...base()} connection={connectedConnection} /> },
    { label: 'Connecting', render: () => <SettingsScreen {...base()} connection={connectionIn('connecting', 2)} /> },
    {
      label: 'Failed, no devices',
      render: () => <SettingsScreen {...base()} connection={failedConnection} pairedDevices={[]} autoConnect={false} />,
    },
  ],
};
