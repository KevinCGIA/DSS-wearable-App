import React from 'react';
import { mockAlertThresholds } from '@/data/mocks';
import type { PreviewEntry } from '@/features/previews/types';
import { AlertThresholdsScreen } from './AlertThresholdsScreen';
import type { AlertThresholdsScreenProps } from './AlertThresholdsScreen';

const noop = () => undefined;

const base: AlertThresholdsScreenProps = {
  draft: mockAlertThresholds,
  loading: false,
  loadError: null,
  saving: false,
  dirty: false,
  validationError: null,
  notice: null,
  onSetEnabled: noop,
  onChangeMin: noop,
  onChangeMax: noop,
  onSave: noop,
  onRetry: noop,
  onBack: noop,
};

export const alertThresholdsPreview: PreviewEntry = {
  title: 'Alert Thresholds',
  group: 'Screens',
  states: [
    { label: 'Saved', render: () => <AlertThresholdsScreen {...base} /> },
    { label: 'Loading', render: () => <AlertThresholdsScreen {...base} loading /> },
    {
      label: 'Load error',
      render: () => <AlertThresholdsScreen {...base} loadError="Couldn't load your alert settings." />,
    },
    {
      label: 'Edited',
      render: () => <AlertThresholdsScreen {...base} draft={{ ...base.draft, hrMax: 140 }} dirty />,
    },
    {
      label: 'Invalid',
      render: () => (
        <AlertThresholdsScreen
          {...base}
          draft={{ enabled: true, hrMin: 95, hrMax: 100 }}
          dirty
          validationError="Maximum must be at least 10 BPM above minimum."
        />
      ),
    },
    {
      label: 'Saving / saved',
      render: () => (
        <AlertThresholdsScreen
          {...base}
          saving
          dirty
          notice={{ tone: 'success', message: 'Alert thresholds saved.' }}
        />
      ),
    },
    { label: 'Off', render: () => <AlertThresholdsScreen {...base} draft={{ ...base.draft, enabled: false }} /> },
  ],
};
