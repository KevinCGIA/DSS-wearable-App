import React from 'react';
import {
  connectedMock,
  connectionIn,
  emptyLatest,
  failedConnection,
  heartRateHistory,
  heartRateLatest,
  noDeviceMock,
  stepsLatest,
} from '@/data/mocks';
import type { PreviewEntry } from '@/features/previews/types';
import { restingRangeFrom } from './dashboardModel';
import { DashboardScreen } from './DashboardScreen';
import type { DashboardScreenProps } from './DashboardScreen';
import { useLiveHeartRate } from './useLiveHeartRate';

const noop = () => undefined;

const base: Omit<DashboardScreenProps, 'now'> = {
  ...noDeviceMock,
  profileLoading: false,
  refreshing: false,
  units: 'metric',
  restingRange: null,
  bottomInset: 0,
  onRefresh: noop,
  onOpenProfile: noop,
  onOpenDevices: noop,
  onOpenHeartRate: noop,
  onOpenSteps: noop,
  onOpenSleep: noop,
};

const connected = (): Omit<DashboardScreenProps, 'now'> => ({
  ...base,
  ...connectedMock,
  heartRate: heartRateLatest(),
  steps: stepsLatest(),
  restingRange: restingRangeFrom(heartRateHistory()),
});

function LiveConnectedHome() {
  const heartRate = useLiveHeartRate();
  return <DashboardScreen {...connected()} heartRate={heartRate} now={Date.now()} />;
}

export const dashboardPreview: PreviewEntry = {
  title: 'Dashboard',
  group: 'Screens',
  states: [
    { label: 'No device', render: () => <DashboardScreen {...base} now={Date.now()} /> },
    {
      label: 'Connecting',
      render: () => <DashboardScreen {...base} connection={connectionIn('connecting', 2)} now={Date.now()} />,
    },
    {
      label: 'Syncing',
      render: () => <DashboardScreen {...connected()} refreshing now={Date.now()} />,
    },
    { label: 'Connected', render: () => <LiveConnectedHome /> },
    { label: 'Imperial', render: () => <DashboardScreen {...connected()} units="imperial" now={Date.now()} /> },
    {
      label: 'Failed',
      render: () => (
        <DashboardScreen {...base} connection={failedConnection} heartRate={emptyLatest} now={Date.now()} />
      ),
    },
  ],
};
