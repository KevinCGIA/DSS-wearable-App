import React from 'react';
import { mockAlerts } from '@/data/mocks';
import type { PreviewEntry } from '@/features/previews/types';
import { NotificationsScreen } from './NotificationsScreen';
import type { NotificationsScreenProps } from './NotificationsScreen';

const noop = () => undefined;

const base = (): NotificationsScreenProps => ({
  now: Date.now(),
  alerts: [],
  loading: false,
  error: null,
  onClearAll: noop,
  onOpenAlertThresholds: noop,
  onRetry: noop,
  onBack: noop,
});

const DAY = 24 * 60 * 60 * 1000;
const older = [
  ...mockAlerts,
  { id: 'a4', type: 'HR_LOW' as const, value: 44, message: 'Heart rate below 50 BPM', timestamp: Date.now() - 4 * DAY },
];

export const notificationsPreview: PreviewEntry = {
  title: 'Notifications',
  group: 'Screens',
  states: [
    { label: 'Empty', render: () => <NotificationsScreen {...base()} /> },
    { label: 'Loading', render: () => <NotificationsScreen {...base()} loading /> },
    { label: 'Error', render: () => <NotificationsScreen {...base()} error="Couldn't load your alerts." /> },
    { label: 'Filled', render: () => <NotificationsScreen {...base()} alerts={older} /> },
  ],
};
