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
import { StepsScreen } from './StepsScreen';

const render = (steps = emptyLatest, history = emptyHistory()) => (
  <StepsScreen now={Date.now()} steps={steps} history={history} showing="All devices" onBack={() => undefined} />
);

export const stepsPreview: PreviewEntry = {
  title: 'Steps',
  group: 'Screens',
  states: [
    { label: 'No data', render: () => render() },
    { label: 'Loading', render: () => render(loadingLatest, loadingHistory()) },
    { label: 'Error', render: () => render(errorLatest, errorHistory()) },
    { label: 'Filled', render: () => render(stepsLatest(), stepsHistory()) },
  ],
};
