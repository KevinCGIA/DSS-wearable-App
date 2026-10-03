import React from 'react';
import {
  emptyHistory,
  emptyLatest,
  errorHistory,
  errorLatest,
  heartRateHistory,
  heartRateLatest,
  loadingHistory,
  loadingLatest,
  mockRestingHrTrends,
} from '@/data/mocks';
import type { PreviewEntry } from '@/features/previews/types';
import { useLiveHeartRate } from '@/features/home/useLiveHeartRate';
import { HeartRateScreen } from './HeartRateScreen';
import type { HeartRateScreenProps } from './HeartRateScreen';

const noop = () => undefined;

const base = (): HeartRateScreenProps => ({
  now: Date.now(),
  heartRate: emptyLatest,
  history: emptyHistory(),
  restingTrends: null,
  bottomInset: 0,
  onOpenAlertThresholds: noop,
});

function LiveHeartRate() {
  const heartRate = useLiveHeartRate();
  return (
    <HeartRateScreen {...base()} heartRate={heartRate} history={heartRateHistory()} restingTrends={mockRestingHrTrends} />
  );
}

export const heartRatePreview: PreviewEntry = {
  title: 'Heart Rate',
  group: 'Screens',
  states: [
    { label: 'No data', render: () => <HeartRateScreen {...base()} /> },
    {
      label: 'Loading',
      render: () => <HeartRateScreen {...base()} heartRate={loadingLatest} history={loadingHistory()} />,
    },
    { label: 'Error', render: () => <HeartRateScreen {...base()} heartRate={errorLatest} history={errorHistory()} /> },
    { label: 'Live', render: () => <LiveHeartRate /> },
    {
      label: 'Stale',
      render: () => (
        <HeartRateScreen {...base()} heartRate={heartRateLatest(68, 42 * 60 * 1000)} history={heartRateHistory()} />
      ),
    },
  ],
};
