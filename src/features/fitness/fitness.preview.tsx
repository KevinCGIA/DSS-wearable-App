import React from 'react';
import {
  emptyHistory,
  emptyLatest,
  errorHistory,
  errorLatest,
  loadingHistory,
  loadingLatest,
  stepsHistory,
  stepsLatest,
} from '@/data/mocks';
import type { PreviewEntry } from '@/features/previews/types';
import { FitnessScreen } from './FitnessScreen';

const render = (
  steps = emptyLatest,
  history = emptyHistory(),
) => <FitnessScreen now={Date.now()} steps={steps} history={history} bottomInset={0} />;

export const fitnessPreview: PreviewEntry = {
  title: 'Fitness',
  group: 'Screens',
  states: [
    { label: 'No data', render: () => render() },
    { label: 'Loading', render: () => render(loadingLatest, loadingHistory()) },
    { label: 'Error', render: () => render(errorLatest, errorHistory()) },
    { label: 'Filled', render: () => render(stepsLatest(), stepsHistory()) },
    { label: 'Goal reached', render: () => render(stepsLatest(11240), stepsHistory(11240)) },
  ],
};
