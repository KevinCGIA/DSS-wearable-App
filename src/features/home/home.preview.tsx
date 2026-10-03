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
import { restingRangeFrom } from './homeModel';
import { HomeScreen } from './HomeScreen';
import type { HomeScreenProps } from './HomeScreen';
import { useLiveHeartRate } from './useLiveHeartRate';

const noop = () => undefined;

const base: Omit<HomeScreenProps, 'now'> = {
  ...noDeviceMock,
  profileLoading: false,
  refreshing: false,
  units: 'metric',
  restingRange: null,
  bottomInset: 0,
  onRefresh: noop,
  onOpenProfile: noop,
  onOpenDevices: noop,
  onOpenTab: noop,
};

const connected = (): Omit<HomeScreenProps, 'now'> => ({
  ...base,
  ...connectedMock,
  heartRate: heartRateLatest(),
  steps: stepsLatest(),
  restingRange: restingRangeFrom(heartRateHistory()),
});

function LiveConnectedHome() {
  const heartRate = useLiveHeartRate();
  return <HomeScreen {...connected()} heartRate={heartRate} now={Date.now()} />;
}

export const homePreview: PreviewEntry = {
  title: 'Home',
  group: 'Screens',
  states: [
    { label: 'No device', render: () => <HomeScreen {...base} now={Date.now()} /> },
    {
      label: 'Connecting',
      render: () => <HomeScreen {...base} connection={connectionIn('connecting', 2)} now={Date.now()} />,
    },
    {
      label: 'Syncing',
      render: () => <HomeScreen {...connected()} refreshing now={Date.now()} />,
    },
    { label: 'Connected', render: () => <LiveConnectedHome /> },
    { label: 'Imperial', render: () => <HomeScreen {...connected()} units="imperial" now={Date.now()} /> },
    {
      label: 'Failed',
      render: () => (
        <HomeScreen {...base} connection={failedConnection} heartRate={emptyLatest} now={Date.now()} />
      ),
    },
  ],
};
