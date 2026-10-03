import React from 'react';
import { defaultPreferences } from '@/data/mocks';
import type { PreviewEntry } from '@/features/previews/types';
import { PreferencesScreen } from './PreferencesScreen';
import type { PreferencesScreenProps } from './PreferencesScreen';

const noop = () => undefined;

const base: PreferencesScreenProps = {
  draft: defaultPreferences,
  saving: false,
  dirty: false,
  notice: null,
  onChangeTextScale: noop,
  onChangeUnits: noop,
  onSetNotifications: noop,
  onSave: noop,
  onBack: noop,
};

export const preferencesPreview: PreviewEntry = {
  title: 'Preferences',
  group: 'Screens',
  states: [
    { label: 'Default', render: () => <PreferencesScreen {...base} /> },
    {
      label: 'Edited',
      render: () => (
        <PreferencesScreen {...base} draft={{ textScale: 'xlarge', units: 'imperial', notifications: false }} dirty />
      ),
    },
    {
      label: 'Saving / saved',
      render: () => (
        <PreferencesScreen
          {...base}
          draft={{ ...defaultPreferences, textScale: 'large' }}
          dirty
          saving
          notice={{ tone: 'success', message: 'Preferences saved.' }}
        />
      ),
    },
  ],
};
