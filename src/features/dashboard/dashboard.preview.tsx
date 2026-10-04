import React, { useState } from 'react';
import {
  emptyHistory,
  emptyLatest,
  heartRateHistory,
  heartRateLatest,
  mockActivityExtras,
  mockDeviceA,
  mockDeviceB,
  mockProfile,
  mockSleep,
  noActivityExtras,
  stepsHistory,
  stepsLatest,
} from '@/data/mocks';
import type { HistoryState } from '@/data/types';
import type { PreviewEntry } from '@/features/previews/types';
import { filterHistory, filterLatest } from '@/lib/sensors/filterReadings';
import { restingRangeFrom } from './dashboardModel';
import type { DashboardDevice } from './dashboardModel';
import { DashboardScreen } from './DashboardScreen';
import type { DashboardScreenProps } from './DashboardScreen';
import { useLiveHeartRate } from './useLiveHeartRate';

const noop = () => undefined;
const HOUR = 60 * 60 * 1000;

const chipA: DashboardDevice = { deviceId: mockDeviceA.id, name: mockDeviceA.name, status: 'connected', rssi: -54 };
const chipB: DashboardDevice = { deviceId: mockDeviceB.id, name: mockDeviceB.name, status: 'connected', rssi: -71 };

const base = (): DashboardScreenProps => ({
  now: Date.now(),
  profile: mockProfile,
  profileLoading: false,
  devices: [],
  filterDeviceId: null,
  heartRate: emptyLatest,
  heartRateHistory: emptyHistory(),
  restingRange: null,
  steps: emptyLatest,
  stepsHistory: emptyHistory(),
  sleep: null,
  activity: noActivityExtras,
  units: 'metric',
  bottomInset: 0,
  onChangeFilter: noop,
  onOpenProfile: noop,
  onOpenDevices: noop,
  onOpenHeartRate: noop,
  onOpenSteps: noop,
  onOpenSleep: noop,
});

function OneDeviceLive() {
  const heartRate = useLiveHeartRate();
  const history = heartRateHistory();
  return (
    <DashboardScreen
      {...base()}
      devices={[chipA]}
      heartRate={heartRate}
      heartRateHistory={history}
      restingRange={restingRangeFrom(history)}
      steps={stepsLatest()}
      stepsHistory={stepsHistory()}
      sleep={mockSleep}
      activity={mockActivityExtras}
    />
  );
}

const merge = (a: HistoryState, b: HistoryState): HistoryState => ({
  ...a,
  readings: [...a.readings, ...b.readings].sort((x, y) => x.timestamp.getTime() - y.timestamp.getTime()),
});

function TwoDevicesWithFilter() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const hrAll = merge(heartRateHistory(mockDeviceA), heartRateHistory(mockDeviceB, 9));
  const stepsAll = merge(stepsHistory(6842, mockDeviceA), stepsHistory(5120, mockDeviceB));
  const latestHr = heartRateLatest(81, 20 * 1000, mockDeviceB);
  const latestSteps = stepsLatest(6842, 3 * 60 * 1000, mockDeviceA);
  const hr = filterHistory(hrAll, deviceId);

  return (
    <DashboardScreen
      {...base()}
      devices={[chipA, chipB]}
      filterDeviceId={deviceId}
      onChangeFilter={setDeviceId}
      heartRate={filterLatest(latestHr, hrAll, deviceId)}
      heartRateHistory={hr}
      restingRange={restingRangeFrom(hr)}
      steps={filterLatest(latestSteps, stepsAll, deviceId)}
      stepsHistory={filterHistory(stepsAll, deviceId)}
      sleep={mockSleep}
      activity={mockActivityExtras}
    />
  );
}

export const dashboardPreview: PreviewEntry = {
  title: 'Dashboard',
  group: 'Screens',
  states: [
    { label: 'No device', render: () => <DashboardScreen {...base()} /> },
    { label: 'One device live', render: () => <OneDeviceLive /> },
    { label: 'Two devices + filter', render: () => <TwoDevicesWithFilter /> },
    {
      label: 'Stale data',
      render: () => (
        <DashboardScreen
          {...base()}
          heartRate={heartRateLatest(68, 3 * HOUR)}
          heartRateHistory={heartRateHistory()}
          restingRange={restingRangeFrom(heartRateHistory())}
          steps={stepsLatest(4210, 3 * HOUR)}
          stepsHistory={stepsHistory(4210)}
        />
      ),
    },
    { label: 'Imperial', render: () => <DashboardScreen {...base()} activity={mockActivityExtras} units="imperial" /> },
  ],
};
