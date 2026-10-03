import React from 'react';
import { mockSleep, mockSleepTrends } from '@/data/mocks';
import type { PreviewEntry } from '@/features/previews/types';
import { SleepScreen } from './SleepScreen';
import type { SleepScreenProps } from './SleepScreen';

const base: SleepScreenProps = {
  sleep: null,
  trends: null,
  loading: false,
  error: null,
  bottomInset: 0,
};

export const sleepPreview: PreviewEntry = {
  title: 'Sleep',
  group: 'Screens',
  states: [
    { label: 'Empty', render: () => <SleepScreen {...base} /> },
    { label: 'Loading', render: () => <SleepScreen {...base} loading /> },
    {
      label: 'Error',
      render: () => (
        <SleepScreen {...base} error="Couldn't load your sleep data." onRetry={() => undefined} />
      ),
    },
    { label: 'Filled', render: () => <SleepScreen {...base} sleep={mockSleep} trends={mockSleepTrends} /> },
  ],
};
