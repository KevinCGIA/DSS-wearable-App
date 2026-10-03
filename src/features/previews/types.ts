import type React from 'react';

export type PreviewState = {
  label: string;
  render: () => React.ReactElement;
};

export type PreviewEntry = {
  title: string;
  group: 'Screens' | 'Primitives';
  states: PreviewState[];
};
