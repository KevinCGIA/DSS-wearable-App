import React, { useEffect } from 'react';
import type { PairedDevice } from '@/data/types';
import { useNow } from '@/lib/useNow';
import { useBle } from './BleProvider';
import { confirmForget } from './bluetoothText';
import { DevicesScreen } from './DevicesScreen';

type Props = {
  onBack: () => void;
};

// Android: app/(auth)/devices.tsx
export function DevicesContainer({ onBack }: Props) {
  const ble = useBle();
  const now = useNow(60 * 1000);
  const { stopScan } = ble;

  // Stop scanning when leaving the screen to save battery (same as Android).
  useEffect(() => () => {
    stopScan();
  }, [stopScan]);

  return (
    <DevicesScreen
      now={now}
      bluetoothState={ble.bluetoothState}
      isScanning={ble.isScanning}
      devices={ble.devices}
      scanError={ble.scanError}
      connection={ble.connection}
      pairedDevices={ble.pairedDevices}
      autoConnect={ble.autoConnect}
      onStartScan={() => {
        ble.startScan();
      }}
      onStopScan={() => {
        ble.stopScan();
      }}
      onConnect={(device) => {
        ble.connect(device);
      }}
      onDisconnect={() => {
        ble.disconnect();
      }}
      onForgetDevice={(device: PairedDevice) => confirmForget(device, ble.forgetDevice)}
      onSetAutoConnect={(enabled) => {
        ble.setAutoConnect(enabled);
      }}
      onBack={onBack}
    />
  );
}
