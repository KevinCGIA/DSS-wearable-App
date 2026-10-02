import { useRouter } from "expo-router";
import { Alert, Button, StyleSheet, Switch, Text, View } from "react-native";

import { useBle } from "../services/ble/BleContext";
import PairedDeviceList from "./PairedDeviceList";

// "Devices" section of the Settings screen
export default function DeviceSettingsSection() {
  const router = useRouter();
  const { connection, disconnect, autoConnect, setAutoConnect } = useBle();
  const { status, deviceName, batteryLevel } = connection;

  const toggleAutoConnect = async (enabled: boolean) => {
    try {
      await setAutoConnect(enabled);
    } catch (e: any) {
      Alert.alert("Error", "Failed to save setting: " + e.message);
    }
  };

  return (
    <View>
      <Text style={Styles.sectionTitle}>Devices</Text>

      <View style={Styles.card}>
        <Text style={Styles.label}>Current device</Text>

        {status === "disconnected" ? (
          <Text style={Styles.deviceName}>None</Text>
        ) : (
          <>
            <Text style={Styles.deviceName}>
              {deviceName ?? "Unknown device"}
            </Text>

            <Text
              style={status === "connected" ? Styles.connected : Styles.pending}
            >
              {status === "connected"
                ? `● Connected${batteryLevel !== null ? ` · 🔋 ${batteryLevel}%` : ""}`
                : status === "disconnecting"
                  ? "Disconnecting..."
                  : "Connecting..."}
            </Text>

            {status !== "disconnecting" && (
              <View style={Styles.button}>
                <Button
                  title={status === "connected" ? "Disconnect" : "Cancel"}
                  color="red"
                  onPress={disconnect}
                />
              </View>
            )}
          </>
        )}
      </View>

      <View style={Styles.switchRow}>
        <View style={Styles.switchText}>
          <Text style={Styles.switchLabel}>Auto-connect</Text>
          <Text style={Styles.hint}>
            Reconnect to your last device when the app opens
          </Text>
        </View>

        <Switch value={autoConnect} onValueChange={toggleAutoConnect} />
      </View>

      <View style={Styles.button}>
        <Button
          title="Pair a New Device"
          onPress={() => router.push("/(auth)/devices")}
        />
      </View>

      <Text style={Styles.subTitle}>Paired devices</Text>

      <PairedDeviceList />
    </View>
  );
}

const Styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },

  subTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 4,
  },

  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 15,
  },

  label: {
    fontSize: 13,
    color: "#666",
  },

  deviceName: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 4,
  },

  connected: {
    fontSize: 14,
    color: "green",
    marginTop: 4,
  },

  pending: {
    fontSize: 14,
    color: "#b26a00",
    marginTop: 4,
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },

  switchText: {
    flex: 1,
    marginRight: 10,
  },

  switchLabel: {
    fontSize: 15,
  },

  hint: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  button: {
    marginTop: 12,
  },
});
