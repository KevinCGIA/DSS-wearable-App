import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useBle } from "../services/ble/BleContext";
import { useNfcPairing } from "../services/nfc/useNfcPairing";

// "Pair with NFC" section of the Devices screen
export default function NfcPairingCard() {
  const { connections } = useBle();
  const { availability, step, pairWithTag, writeTag, cancel } =
    useNfcPairing();

  const connected = connections.filter((c) => c.status === "connected");

  if (availability === null) {
    return null;
  }

  if (availability === "unsupported") {
    return (
      <View style={Styles.card}>
        <Text style={Styles.title}>📶 Pair with NFC</Text>
        <Text style={Styles.hint}>This phone doesn't have NFC.</Text>
      </View>
    );
  }

  const chooseDeviceToWrite = () => {
    const devices = connected.map((c) => ({
      deviceId: c.deviceId,
      name: c.deviceName ?? "Unknown device",
    }));

    if (devices.length === 1) {
      writeTag(devices[0]);
      return;
    }

    Alert.alert("Write Pairing Tag", "Which device should the tag connect to?", [
      ...devices.map((device) => ({
        text: device.name,
        onPress: () => writeTag(device),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  if (step !== "idle") {
    return (
      <View style={Styles.card}>
        <Text style={Styles.title}>📶 Pair with NFC</Text>

        <View style={Styles.waitingRow}>
          <ActivityIndicator size="small" />
          <Text style={Styles.waitingText}>
            {step === "findingDevice"
              ? "Looking for the device..."
              : step === "writing"
                ? "Hold your phone near a blank NFC tag..."
                : "Hold your phone near the wearable's NFC tag..."}
          </Text>
        </View>

        {step !== "findingDevice" && (
          <Button title="Cancel" color="red" onPress={cancel} />
        )}
      </View>
    );
  }

  return (
    <View style={Styles.card}>
      <Text style={Styles.title}>📶 Pair with NFC</Text>
      <Text style={Styles.hint}>
        Tap your phone on a wearable's NFC tag to connect without scanning.
      </Text>

      <Button title="Tap to Pair" onPress={pairWithTag} />

      {connected.length > 0 && (
        <View style={Styles.secondButton}>
          <Button
            title="Write Pairing Tag"
            onPress={chooseDeviceToWrite}
          />
        </View>
      )}

      {availability === "disabled" && (
        <Text style={Styles.hint}>NFC is turned off on this phone.</Text>
      )}
    </View>
  );
}

const Styles = StyleSheet.create({
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
  },

  title: {
    fontSize: 16,
    fontWeight: "bold",
  },

  hint: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    marginBottom: 10,
  },

  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },

  waitingText: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },

  secondButton: {
    marginTop: 10,
  },
});
