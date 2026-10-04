import React from 'react';
import type { PreviewEntry } from '@/features/previews/types';
import type { DevicesModel } from './deviceModel';
import { devicesFixture, fixtureDeviceD, fixtureDeviceE, mockDeviceA, mockDeviceB, mockDeviceC } from './devicesFixture';
import { DevicesScreen } from './DevicesScreen';
import type { DevicesScreenProps } from './DevicesScreen';

const noop = () => undefined;

const screen = (model: DevicesModel, extra: Partial<DevicesScreenProps> = {}) => (
  <DevicesScreen
    now={Date.now()}
    bluetoothState="PoweredOn"
    loading={false}
    error={null}
    connected={model.connected}
    previous={model.previous}
    summary={model.summary}
    bottomInset={0}
    onAddDevice={noop}
    onOpenDevice={noop}
    onConnect={noop}
    onDisconnect={noop}
    onForget={noop}
    {...extra}
  />
);

const watch = { device: mockDeviceA, connectedMinAgo: 25, rssi: -56, battery: 81 };
const empty = () => devicesFixture(Date.now(), { keep: [] });

export const devicesPreview: PreviewEntry = {
  title: 'Devices',
  group: 'Screens',
  states: [
    { label: 'No devices', render: () => screen(empty()) },
    { label: 'One connected', render: () => screen(devicesFixture(Date.now(), { keep: [], live: [watch] })) },
    {
      label: 'Three connected (Stable, Unstable, Not responding)',
      render: () =>
        screen(
          devicesFixture(Date.now(), {
            keep: [],
            live: [
              watch,
              { device: mockDeviceB, connectedMinAgo: 12, rssi: -74, battery: null },
              { device: mockDeviceC, connectedMinAgo: 9, silentMs: 3 * 60 * 1000, rssi: -88, battery: 22 },
            ],
          }),
        ),
    },
    {
      label: 'Two connected + three previous',
      render: () =>
        screen(
          devicesFixture(Date.now(), {
            keep: [mockDeviceB.id, mockDeviceC.id, fixtureDeviceD.id],
            copies: [{ device: fixtureDeviceD, from: mockDeviceA, shiftDays: 4 }],
            live: [watch, { device: fixtureDeviceE, connectedMinAgo: 6, rssi: -63, battery: 64 }],
          }),
        ),
    },
    { label: 'Previous only', render: () => screen(devicesFixture(Date.now())) },
    { label: 'Bluetooth off', render: () => screen(devicesFixture(Date.now()), { bluetoothState: 'PoweredOff' }) },
    { label: 'Loading', render: () => screen(empty(), { loading: true }) },
    {
      label: 'Error',
      render: () => screen(devicesFixture(Date.now()), { error: "Couldn't load your history." }),
    },
  ],
};
