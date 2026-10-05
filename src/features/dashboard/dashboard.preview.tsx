import React from 'react';
import {
  connectedMock,
  connectionIn,
  emptyHistory,
  emptyLatest,
  failedConnection,
  heartRateHistory,
  heartRateLatest,
  mockDeviceA,
  mockDeviceB,
  mockSleepTrends,
  noDeviceMock,
  stepsHistory,
  stepsLatest,
} from '@/data/mocks';
import { TabBar, tabBarBaseHeight } from '@/components/ui/TabBar';
import type { PreviewEntry } from '@/features/previews/types';
import { restingRangeFrom } from './dashboardModel';
import type { DeviceSummary } from './dashboardModel';
import { DashboardScreen } from './DashboardScreen';
import type { DashboardScreenProps } from './DashboardScreen';
import { useLiveHeartRate } from './useLiveHeartRate';

const noop = () => undefined;
const MIN = 60 * 1000;

const base = (): Omit<DashboardScreenProps, 'now'> => ({
  ...noDeviceMock,
  devices: [],
  profileLoading: false,
  refreshing: false,
  units: 'metric',
  heartRateHistory: emptyHistory(),
  stepsHistory: emptyHistory(),
  restingRange: null,
  sleepTrends: null,
  bottomInset: 0,
  onRefresh: noop,
  onOpenProfile: noop,
  onOpenDevices: noop,
  onOpenHeartRate: noop,
  onOpenSteps: noop,
  onOpenSleep: noop,
});

const watch: DeviceSummary = {
  deviceId: mockDeviceA.id,
  name: mockDeviceA.name,
  status: 'connected',
  rssi: -54,
  batteryLevel: 85,
  lastSync: Date.now() - 30 * 1000,
};
const strap: DeviceSummary = {
  deviceId: mockDeviceB.id,
  name: mockDeviceB.name,
  status: 'connected',
  rssi: -71,
  batteryLevel: null,
  lastSync: Date.now() - 2 * MIN,
};
const band: DeviceSummary = {
  deviceId: '7F:11:E4:62:AA:03',
  name: 'Mi Smart Band 8',
  status: 'reconnecting',
  rssi: -88,
  batteryLevel: 40,
  lastSync: Date.now() - 14 * MIN,
};

const connected = (): Omit<DashboardScreenProps, 'now'> => {
  const hr = heartRateHistory();
  return {
    ...base(),
    ...connectedMock,
    devices: [watch],
    heartRate: heartRateLatest(),
    heartRateHistory: hr,
    restingRange: restingRangeFrom(hr),
    steps: stepsLatest(),
    stepsHistory: stepsHistory(),
    sleepTrends: mockSleepTrends,
  };
};

function LiveConnected() {
  const heartRate = useLiveHeartRate();
  return <DashboardScreen {...connected()} heartRate={heartRate} now={Date.now()} />;
}

export const dashboardPreview: PreviewEntry = {
  title: 'Dashboard',
  group: 'Screens',
  states: [
    { label: 'No device', render: () => <DashboardScreen {...base()} now={Date.now()} /> },
    {
      label: 'Connecting',
      render: () => <DashboardScreen {...base()} connection={connectionIn('connecting', 2)} now={Date.now()} />,
    },
    { label: 'Syncing', render: () => <DashboardScreen {...connected()} refreshing now={Date.now()} /> },
    { label: 'Connected', render: () => <LiveConnected /> },
    {
      label: 'With tab bar',
      render: () => (
        <>
          <DashboardScreen {...connected()} bottomInset={tabBarBaseHeight} now={Date.now()} />
          <TabBar active="dashboard" onChange={noop} />
        </>
      ),
    },
    { label: 'Imperial', render: () => <DashboardScreen {...connected()} units="imperial" now={Date.now()} /> },
    {
      label: 'Failed',
      render: () => (
        <DashboardScreen {...base()} connection={failedConnection} heartRate={emptyLatest} now={Date.now()} />
      ),
    },
    {
      label: 'Expanded: no device',
      render: () => <DashboardScreen {...base()} initiallyExpanded now={Date.now()} />,
    },
    {
      label: 'Expanded: one device',
      render: () => <DashboardScreen {...connected()} initiallyExpanded now={Date.now()} />,
    },
    {
      label: 'Expanded: three devices',
      render: () => <DashboardScreen {...connected()} devices={[watch, strap, band]} initiallyExpanded now={Date.now()} />,
    },
  ],
};
