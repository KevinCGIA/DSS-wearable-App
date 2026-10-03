import React from 'react';
import { mockProfile } from '@/data/mocks';
import type { PreviewEntry } from '@/features/previews/types';
import { ProfileScreen } from './ProfileScreen';
import type { ProfileScreenProps } from './ProfileScreen';

const noop = () => undefined;

const base: ProfileScreenProps = {
  units: 'metric',
  profile: mockProfile,
  profileLoading: false,
  profileError: null,
  form: { name: mockProfile.name, height: '178', weight: '72' },
  formErrors: {},
  saving: false,
  dirty: false,
  profileNotice: null,
  newEmail: '',
  emailError: undefined,
  accountBusy: null,
  accountNotice: null,
  onRetryProfile: noop,
  onChangeForm: noop,
  onChooseProfilePicture: noop,
  onSaveProfile: noop,
  onChangeNewEmail: noop,
  onChangeEmail: noop,
  onChangePassword: noop,
  onBack: noop,
};

export const profilePreview: PreviewEntry = {
  title: 'Profile',
  group: 'Screens',
  states: [
    { label: 'Default', render: () => <ProfileScreen {...base} /> },
    {
      label: 'Imperial',
      render: () => <ProfileScreen {...base} units="imperial" form={{ name: mockProfile.name, height: '70.1', weight: '158.7' }} />,
    },
    { label: 'Loading', render: () => <ProfileScreen {...base} profile={null} profileLoading /> },
    {
      label: 'Load error',
      render: () => <ProfileScreen {...base} profile={null} profileError="Failed to load profile: No connection." />,
    },
    {
      label: 'Unsaved changes',
      render: () => <ProfileScreen {...base} form={{ name: 'Tarun Balaji', height: '180', weight: '72' }} dirty />,
    },
    {
      label: 'Saving',
      render: () => <ProfileScreen {...base} form={{ name: 'Tarun Balaji', height: '180', weight: '72' }} dirty saving />,
    },
    {
      label: 'Errors',
      render: () => (
        <ProfileScreen
          {...base}
          form={{ name: 'Tarun', height: '17', weight: '72' }}
          formErrors={{ height: 'Enter a height in cm between 50 and 250.' }}
          dirty
          newEmail="tarun@"
          emailError="That email address doesn't look right."
          profileNotice={{ tone: 'error', message: 'Failed to update profile: No connection.' }}
        />
      ),
    },
    {
      label: 'Account notices',
      render: () => (
        <ProfileScreen
          {...base}
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
