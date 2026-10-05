import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

import { useBle } from "../ble/BleContext";
import { bleService } from "../ble/BleService";
import { requestBlePermissions } from "../ble/permissions";
import {
  cancelNfc,
  getNfcAvailability,
  NfcAvailability,
  openNfcSettings,
  readPairingTag,
  writePairingTag,
} from "./NfcService";

export type NfcStep = "idle" | "waitingForTag" | "findingDevice" | "writing";

// "Tap to pair" and "write a pairing tag" for the Devices screen
export function useNfcPairing() {
  const { connect } = useBle();
  const [availability, setAvailability] =
    useState<NfcAvailability | null>(null);
  const [step, setStep] = useState<NfcStep>("idle");

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

    if (current === "disabled") {
      Alert.alert("NFC is off", "Turn on NFC to pair by tapping.", [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => openNfcSettings() },
      ]);
    }

    return current === "available";
  }, []);

  const pairWithTag = useCallback(async () => {
    if (!(await checkReady())) {
      return;
    }

    setStep("waitingForTag");

    try {
      const info = await readPairingTag();

      if (!info) {
        Alert.alert(
          "Not a pairing tag",
          "This NFC tag doesn't contain a wearable device."
        );
        return;
      }

      if (Platform.OS === "android" && info.deviceId) {
        // Android can connect by Bluetooth address directly
        await connect({ id: info.deviceId, name: info.name });
        return;
      }

      if (!info.name) {
        Alert.alert(
          "Can't pair on this phone",
          "This tag only has a Bluetooth address, which iPhones can't connect to directly."
        );
        return;
      }

      // iOS: find the device by name with a short scan
      if (!(await requestBlePermissions())) {
        return;
      }

      setStep("findingDevice");
      const device = await bleService.findDevice(
        (d) => d.name === info.name
      );

      if (!device) {
        Alert.alert(
          "Device not found",
          `Couldn't find ${info.name} nearby. Make sure it's on and close to your phone.`
        );
        return;
      }

      await connect({ id: device.id, name: device.name });
    } catch (e: any) {
      // Cancelling the read (or leaving the screen) also lands here
      console.log("NFC pairing failed:", e);
    } finally {
      setStep("idle");
    }
  }, [checkReady, connect]);

  const writeTag = useCallback(
    async (device: { deviceId: string; name: string }) => {
      if (!(await checkReady())) {
        return;
      }

      setStep("writing");

      try {
        await writePairingTag(device);
        Alert.alert(
          "Tag saved",
          `Tap this tag with the app open to connect to ${device.name}.`
        );
      } catch (e: any) {
        console.log("NFC write failed:", e);
        Alert.alert(
          "Couldn't write tag",
          "Make sure it's a writable NFC tag (NTAG213 or similar) and hold the phone still."
        );
      } finally {
        setStep("idle");
      }
    },
    [checkReady]
  );

  const cancel = useCallback(() => {
    cancelNfc();
    setStep("idle");
  }, []);

  return { availability, step, pairWithTag, writeTag, cancel };
}
