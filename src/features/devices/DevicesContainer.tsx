import React from 'react';
import { confirmForget } from './bluetoothText';
import { DevicesScreen } from './DevicesScreen';
import { useDevicesData } from './useDevicesData';

type Props = {
  bottomInset: number;
  onAddDevice: () => void;
  onOpenDevice: (deviceId: string) => void;
};

export function DevicesContainer({ bottomInset, onAddDevice, onOpenDevice }: Props) {
  const { ble, now, model, loading, error } = useDevicesData();

  return (
    <DevicesScreen
      now={now}
      bluetoothState={ble.bluetoothState}
      loading={loading}
      error={error}
      connected={model.connected}
      previous={model.previous}
      summary={model.summary}
      bottomInset={bottomInset}
      onAddDevice={onAddDevice}
      onOpenDevice={onOpenDevice}
      onConnect={(device) => {
        ble.connect({ id: device.deviceId, name: device.name });
      }}
      onDisconnect={(device) => {
        ble.disconnect(device.deviceId);
      }}
      onForget={(device) => confirmForget(device, ble.forgetDevice)}
    />
  );
}
