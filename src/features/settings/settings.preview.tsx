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
  profileError: null,
  form: { name: mockProfile.name, height: '178', weight: '72' },
  formErrors: {},
  saving: false,
  profileNotice: null,
  newEmail: '',
  emailError: undefined,
  accountBusy: null,
  accountNotice: null,
  connection: disconnectedConnection,
  pairedDevices: mockPairedDevices,
  autoConnect: true,
  onRetryProfile: noop,
  onChangeForm: noop,
  onChooseProfilePicture: noop,
  onSaveProfile: noop,
  onChangeNewEmail: noop,
  onChangeEmail: noop,
  onChangePassword: noop,
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
    { label: 'Loading', render: () => <SettingsScreen {...base()} profileLoading /> },
    {
      label: 'Load error',
      render: () => <SettingsScreen {...base()} profileError="Failed to load profile: No connection." />,
    },
    { label: 'Connected', render: () => <SettingsScreen {...base()} connection={connectedConnection} /> },
    { label: 'Connecting', render: () => <SettingsScreen {...base()} connection={connectionIn('connecting', 2)} /> },
    {
      label: 'Failed, no devices',
      render: () => <SettingsScreen {...base()} connection={failedConnection} pairedDevices={[]} autoConnect={false} />,
    },
    {
      label: 'Saving / errors',
      render: () => (
        <SettingsScreen
          {...base()}
          form={{ name: 'Tarun', height: '17', weight: '72' }}
          formErrors={{ height: 'Enter a height in cm between 50 and 250.' }}
          newEmail="tarun@"
          emailError="That email address doesn't look right."
        />
      ),
    },
    {
      label: 'Success notices',
      render: () => (
        <SettingsScreen
          {...base()}
          saving
          profileNotice={{ tone: 'success', message: 'Profile updated successfully!' }}
          accountBusy="password"
          accountNotice={{
            tone: 'success',
            message: 'Verification email sent to new@example.com. Click the link to finish changing your email.',
          }}
        />
      ),
    },
  ],
};
