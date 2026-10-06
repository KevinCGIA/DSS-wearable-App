import React, { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import type { PairedDevice } from '@/data/types';
import { useNow } from '@/lib/useNow';
import { useBle } from './BleProvider';
import { confirmForget } from './bluetoothText';
import { AddDeviceScreen } from './AddDeviceScreen';
import { connectionsOf } from './connections';
import { useNfcPairing } from './useNfcPairing';

type Props = {
  onBack: () => void;
};

// Android: app/(auth)/devices.tsx (the scan and connect flow, opened from the Devices tab).
export function AddDeviceContainer({ onBack }: Props) {
  const ble = useBle();
  const now = useNow(60 * 1000);
  const { stopScan } = ble;
  const nfc = useNfcPairing(ble);

  const all = connectionsOf(ble);
  const activeDeviceIds = all
    .filter((c) => c.status !== 'disconnected' && c.deviceId)
    .map((c) => c.deviceId as string);
  const writableDevices = all
    .filter((c) => c.status === 'connected' && c.deviceId)
    .map((c) => ({ deviceId: c.deviceId as string, name: c.deviceName ?? 'Unknown device' }));

  const chooseDeviceToWrite = () => {
    if (writableDevices.length === 1) {
      nfc.writeTag(writableDevices[0]);
      return;
    }
    Alert.alert('Write Pairing Tag', 'Which device should the tag connect to?', [
      ...writableDevices.map((device) => ({ text: device.name, onPress: () => nfc.writeTag(device) })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  // Stop scanning when leaving the screen to save battery (same as Android).
  useEffect(() => () => {
    stopScan();
  }, [stopScan]);

  useEffect(() => {
    ble.ensureBluetoothReady?.();
  }, [ble.ensureBluetoothReady]);

  return (
    <AddDeviceScreen
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
      onOpenSettings={() => {
        Linking.openSettings();
      }}
      activeDeviceIds={activeDeviceIds}
      nfc={{
        availability: nfc.availability,
        step: nfc.step,
        writableDevices,
        onPair: nfc.pairWithTag,
        onWrite: chooseDeviceToWrite,
        onCancel: nfc.cancel,
      }}
    />
  );
}
