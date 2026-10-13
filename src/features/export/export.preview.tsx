import React from 'react';
import type { PreviewEntry } from '@/features/previews/types';
import { ExportScreen } from './ExportScreen';
import type { ExportScreenProps } from './ExportScreen';

const noop = () => undefined;
const base: ExportScreenProps = { range: '24h', exporting: false, notice: null, onChangeRange: noop, onExport: noop, onBack: noop };

export const exportPreview: PreviewEntry = {
  title: 'Export data',
  group: 'Screens',
  states: [
    { label: 'Default', render: () => <ExportScreen {...base} /> },
    { label: 'Exporting', render: () => <ExportScreen {...base} range="7d" exporting /> },
    {
      label: 'Exported',
      render: () => <ExportScreen {...base} notice={{ tone: 'success', message: 'Exported 86,412 readings.' }} />,
    },
    {
      label: 'Nothing saved',
      render: () => <ExportScreen {...base} notice={{ tone: 'info', message: 'No readings were saved in the last 24 hours.' }} />,
    },
    {
      label: 'Too many for one file',
      render: () => (
        <ExportScreen
          {...base}
          range="30d"
          notice={{
            tone: 'info',
            message:
              'Exported the newest 200,000 readings. There were more than fit in one file: choose a shorter range for the rest.',
          }}
        />
      ),
    },
    {
      label: 'Error',
      render: () => (
        <ExportScreen {...base} notice={{ tone: 'error', message: "Couldn't export your readings. Try again in a moment." }} />
      ),
    },
  ],
};
