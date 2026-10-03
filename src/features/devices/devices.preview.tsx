import React from 'react';
import {
  connectedConnection,
  connectionIn,
  disconnectedConnection,
  failedConnection,
  mockPairedDevices,
  mockScannedDevices,
} from '@/data/mocks';
import type { PreviewEntry } from '@/features/previews/types';
import { DevicesScreen } from './DevicesScreen';
import type { DevicesScreenProps } from './DevicesScreen';

const noop = () => undefined;

const base = (): DevicesScreenProps => ({
  now: Date.now(),
  bluetoothState: 'PoweredOn',
  isScanning: false,
  devices: [],
  scanError: null,
  connection: disconnectedConnection,
  pairedDevices: mockPairedDevices,
  autoConnect: true,
  onStartScan: noop,
  onStopScan: noop,
  onConnect: noop,
  onDisconnect: noop,
  onForgetDevice: noop,
  onSetAutoConnect: noop,
  onBack: noop,
});

const found = mockScannedDevices;

export const devicesPreview: PreviewEntry = {
  title: 'Devices',
  group: 'Screens',
  states: [
    { label: 'Idle', render: () => <DevicesScreen {...base()} /> },
    { label: 'Scanning', render: () => <DevicesScreen {...base()} isScanning devices={found.slice(0, 2)} /> },
    { label: 'Results', render: () => <DevicesScreen {...base()} devices={found} /> },
    {
      label: 'Connecting',
      render: () => <DevicesScreen {...base()} devices={found} connection={connectionIn('connecting', 2)} />,
    },
    { label: 'Setting up', render: () => <DevicesScreen {...base()} connection={connectionIn('discovering')} /> },
    {
      label: 'Connected',
      render: () => <DevicesScreen {...base()} devices={found} connection={connectedConnection} />,
    },
    { label: 'Reconnecting', render: () => <DevicesScreen {...base()} connection={connectionIn('reconnecting', 3)} /> },
    { label: 'Disconnecting', render: () => <DevicesScreen {...base()} connection={connectionIn('disconnecting')} /> },
    { label: 'Failed', render: () => <DevicesScreen {...base()} connection={failedConnection} /> },
    { label: 'Bluetooth off', render: () => <DevicesScreen {...base()} bluetoothState="PoweredOff" /> },
    { label: 'Permission denied', render: () => <DevicesScreen {...base()} bluetoothState="Unauthorized" /> },
    {
      label: 'No paired',
      render: () => <DevicesScreen {...base()} pairedDevices={[]} autoConnect={false} />,
    },
  ],
};
