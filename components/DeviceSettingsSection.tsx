import { useRouter } from "expo-router";
import { Alert, Button, StyleSheet, Switch, Text, View } from "react-native";

import { useBle } from "../services/ble/BleContext";
import ConnectedDeviceList from "./ConnectedDeviceList";
import PairedDeviceList from "./PairedDeviceList";

// "Devices" section of the Settings screen
export default function DeviceSettingsSection() {
  const router = useRouter();
  const { autoConnect, setAutoConnect } = useBle();

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

      <Text style={Styles.subTitleFirst}>Connected devices</Text>

      <ConnectedDeviceList />

      <View style={Styles.switchRow}>
        <View style={Styles.switchText}>
          <Text style={Styles.switchLabel}>Auto-connect</Text>
          <Text style={Styles.hint}>
            Reconnect to your paired devices when the app opens
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

  subTitleFirst: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 4,
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
