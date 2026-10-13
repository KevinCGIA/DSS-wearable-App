import React from 'react';
import type { PreviewEntry } from '@/features/previews/types';
import { DeviceDetailScreen } from './DeviceDetailScreen';
import type { DeviceDetailScreenProps } from './DeviceDetailScreen';
import type { TestedDevice } from './deviceModel';
import { devicesFixture, mockDeviceA, mockDeviceB, mockDeviceC } from './devicesFixture';

const noop = () => undefined;

const screen = (device: TestedDevice | null, extra: Partial<DeviceDetailScreenProps> = {}) => (
  <DeviceDetailScreen
    now={Date.now()}
    device={device}
    bluetoothState="PoweredOn"
    onBack={noop}
    onConnect={noop}
    onDisconnect={noop}
    onForget={noop}
    {...extra}
  />
);

const find = (devices: TestedDevice[], id: string) => devices.find((d) => d.deviceId === id) ?? null;

// Galaxy Watch8 connected now, with three rounds of history (19 sessions).
const longHistory = () =>
  find(
    devicesFixture(Date.now(), {
      live: [{ device: mockDeviceA, connectedMinAgo: 42, rssi: -56, battery: 81 }],
      copies: [
        { device: mockDeviceA, from: mockDeviceA, shiftDays: 10 },
        { device: mockDeviceA, from: mockDeviceA, shiftDays: 20 },
      ],
    }).connected,
    mockDeviceA.id,
  );

export const deviceDetailPreview: PreviewEntry = {
  title: 'Device detail',
  group: 'Screens',
  states: [
    {
      label: 'Connected, long history',
      render: () => screen(longHistory(), { testTools: { onSimulateDropOut: noop, onTogglePause: noop } }),
    },
    {
      label: 'Previously connected (Unstable)',
      render: () => screen(find(devicesFixture(Date.now()).previous, mockDeviceB.id)),
    },
    {
      label: 'Not responding',
      render: () =>
        screen(
          find(
            devicesFixture(Date.now(), {
              live: [{ device: mockDeviceC, connectedMinAgo: 9, silentMs: 3 * 60 * 1000, rssi: -88, battery: 22 }],
            }).connected,
            mockDeviceC.id,
          ),
        ),
    },
    {
      label: 'Bluetooth off',
      render: () => screen(find(devicesFixture(Date.now()).previous, mockDeviceA.id), { bluetoothState: 'PoweredOff' }),
    },
    { label: 'Not found', render: () => screen(null) },
  ],
};
