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
import { AddDeviceScreen } from './AddDeviceScreen';
import type { AddDeviceScreenProps } from './AddDeviceScreen';
import type { NfcPairingCardProps } from './NfcPairingCard';

const noop = () => undefined;

const base = (): AddDeviceScreenProps => ({
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

const nfc = (overrides: Partial<NfcPairingCardProps> = {}): NfcPairingCardProps => ({
  availability: 'available',
  step: 'idle',
  writableDevices: [],
  onPair: noop,
  onWrite: noop,
  onCancel: noop,
  ...overrides,
});
const watch = { deviceId: connectedConnection.deviceId ?? 'watch', name: connectedConnection.deviceName ?? 'Watch' };

export const addDevicePreview: PreviewEntry = {
  title: 'Add device',
  group: 'Screens',
  states: [
    { label: 'Idle', render: () => <AddDeviceScreen {...base()} /> },
    { label: 'Scanning', render: () => <AddDeviceScreen {...base()} isScanning devices={found.slice(0, 2)} /> },
    { label: 'Results', render: () => <AddDeviceScreen {...base()} devices={found} /> },
    {
      label: 'Connecting',
      render: () => <AddDeviceScreen {...base()} devices={found} connection={connectionIn('connecting', 2)} />,
    },
    { label: 'Setting up', render: () => <AddDeviceScreen {...base()} connection={connectionIn('discovering')} /> },
    {
      label: 'Connected',
      render: () => <AddDeviceScreen {...base()} devices={found} connection={connectedConnection} />,
    },
    { label: 'Reconnecting', render: () => <AddDeviceScreen {...base()} connection={connectionIn('reconnecting', 3)} /> },
    { label: 'Disconnecting', render: () => <AddDeviceScreen {...base()} connection={connectionIn('disconnecting')} /> },
    { label: 'Failed', render: () => <AddDeviceScreen {...base()} connection={failedConnection} /> },
    { label: 'Bluetooth off', render: () => <AddDeviceScreen {...base()} bluetoothState="PoweredOff" /> },
    { label: 'Permission denied', render: () => <AddDeviceScreen {...base()} bluetoothState="Unauthorized" /> },
    {
      label: 'No paired',
      render: () => <AddDeviceScreen {...base()} pairedDevices={[]} autoConnect={false} />,
    },
    { label: 'NFC: ready', render: () => <AddDeviceScreen {...base()} nfc={nfc()} /> },
    {
      label: 'NFC: connected (write tag)',
      render: () => (
        <AddDeviceScreen {...base()} connection={connectedConnection} nfc={nfc({ writableDevices: [watch] })} />
      ),
    },
    { label: 'NFC: waiting for tag', render: () => <AddDeviceScreen {...base()} nfc={nfc({ step: 'waitingForTag' })} /> },
    {
      label: 'NFC: writing tag',
      render: () => (
        <AddDeviceScreen {...base()} connection={connectedConnection} nfc={nfc({ step: 'writing', writableDevices: [watch] })} />
      ),
    },
    { label: 'NFC: turned off', render: () => <AddDeviceScreen {...base()} nfc={nfc({ availability: 'disabled' })} /> },
  ],
};
