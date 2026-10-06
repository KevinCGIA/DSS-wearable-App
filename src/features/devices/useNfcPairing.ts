import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  cancelNfc,
  getNfcAvailability,
  type NfcAvailability,
  openNfcSettings,
  readPairingTag,
  writePairingTag,
} from '@/lib/nfc/NfcService';
import type { BleContextValue } from './BleProvider';

export type NfcStep = 'idle' | 'waitingForTag' | 'findingDevice' | 'writing';

// "Tap to Pair" and "Write Pairing Tag" for the Add device screen. See lib/nfc/pairingTag.ts
// for the tag formats.
export function useNfcPairing(ble: Pick<BleContextValue, 'connect' | 'findDeviceByName'>) {
  const [availability, setAvailability] = useState<NfcAvailability | null>(null);
  const [step, setStep] = useState<NfcStep>('idle');
  const { connect, findDeviceByName } = ble;

  useEffect(() => {
    getNfcAvailability().then(setAvailability);
    // Stop listening for tags when leaving the screen
    return () => {
      cancelNfc();
    };
  }, []);

  const checkReady = useCallback(async () => {
    const current = await getNfcAvailability();
    setAvailability(current);
    if (current === 'disabled') {
      Alert.alert('NFC is off', 'Turn on NFC to pair by tapping.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => openNfcSettings() },
      ]);
    }
    return current === 'available';
  }, []);

  const pairWithTag = useCallback(async () => {
    if (!(await checkReady())) return;
    setStep('waitingForTag');
    try {
      const info = await readPairingTag();
      if (!info) {
        Alert.alert('Not a pairing tag', "This NFC tag doesn't contain a wearable device.");
        return;
      }

      // Android can connect by Bluetooth address directly
      if (Platform.OS === 'android' && info.deviceId) {
        await connect({ id: info.deviceId, name: info.name });
        return;
      }

      if (!info.name || !findDeviceByName) {
        Alert.alert(
          "Can't pair on this phone",
          "This tag only has a Bluetooth address, which iPhones can't connect to directly.",
        );
        return;
      }

      // iOS: find the device by name with a short scan
      setStep('findingDevice');
      const device = await findDeviceByName(info.name);
      if (!device) {
        Alert.alert(
          'Device not found',
          `Couldn't find ${info.name} nearby. Make sure it's on and close to your phone.`,
        );
        return;
      }
      await connect({ id: device.id, name: device.name });
    } catch (error) {
      // Cancelling the read (or leaving the screen) also lands here
      console.log('NFC pairing failed:', error);
    } finally {
      setStep('idle');
    }
  }, [checkReady, connect, findDeviceByName]);

  const writeTag = useCallback(async (device: { deviceId: string; name: string }) => {
    if (!(await checkReady())) return;
    setStep('writing');
    try {
      await writePairingTag(device);
      Alert.alert('Tag saved', `Tap this tag with the app open to connect to ${device.name}.`);
    } catch (error) {
      console.log('NFC write failed:', error);
      Alert.alert(
        "Couldn't write tag",
        "Make sure it's a writable NFC tag (NTAG213 or similar) and hold the phone still.",
      );
    } finally {
      setStep('idle');
    }
  }, [checkReady]);

  const cancel = useCallback(() => {
    cancelNfc();
    setStep('idle');
  }, []);

  return { availability, step, pairWithTag, writeTag, cancel };
}
