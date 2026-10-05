import React from 'react';
import { confirmForget } from './bluetoothText';
import { DeviceDetailScreen } from './DeviceDetailScreen';
import { useDevicesData } from './useDevicesData';

type Props = {
  deviceId: string;
  onBack: () => void;
};

export function DeviceDetailContainer({ deviceId, onBack }: Props) {
  const { ble, now, model } = useDevicesData();
  const device = [...model.connected, ...model.previous].find((d) => d.deviceId === deviceId) ?? null;

  return (
    <DeviceDetailScreen
      now={now}
      device={device}
      bluetoothState={ble.bluetoothState}
      testTools={
        __DEV__ && ble.supportsTestControls && device
          ? {
              onSimulateDropOut: () => ble.simulateDropOut(device.deviceId),
              onTogglePause: () => ble.setReadingsPaused(device.deviceId, !device.paused),
            }
          : undefined
      }
      onBack={onBack}
      onConnect={() => {
        if (device) ble.connect({ id: device.deviceId, name: device.name });
      }}
      onDisconnect={() => {
        ble.disconnect(deviceId);
      }}
      onForget={() => {
        if (!device) return;
        confirmForget(device, (id) => {
          ble.forgetDevice(id);
          onBack();
        });
      }}
    />
  );
}
