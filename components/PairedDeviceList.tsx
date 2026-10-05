import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { activeConnections, useBle } from "../services/ble/BleContext";
import { MAX_CONNECTED_DEVICES } from "../services/ble/constants";
import { PairedDevice } from "../services/devices/pairedDevices";
import { formatAge } from "../services/sensors/time";

// Devices this account has connected to before, with Connect / Forget
export default function PairedDeviceList() {
  const { pairedDevices, connections, connect, forgetDevice } = useBle();

  const atLimit =
    activeConnections(connections).length >= MAX_CONNECTED_DEVICES;

  const confirmForget = (device: PairedDevice) => {
    Alert.alert(
      "Forget Device",
      `Remove ${device.name}? You'll need to scan for it again to reconnect.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Forget",
          style: "destructive",
          onPress: async () => {
            try {
              await forgetDevice(device);
            } catch (e: any) {
              Alert.alert("Error", "Failed to forget device: " + e.message);
            }
          },
        },
      ]
    );
  };

  if (pairedDevices.length === 0) {
    return (
      <Text style={Styles.empty}>
        No paired devices yet. Devices you connect to will appear here.
      </Text>
    );
  }

  return (
    <View>
      {pairedDevices.map((device) => {
        const connection = connections.find(
          (c) => c.deviceId === device.deviceId
        );
        const isConnected = connection?.status === "connected";
        const isConnecting =
          !!connection &&
          connection.status !== "connected" &&
          connection.status !== "disconnected";

        return (
          <View key={device.docId} style={Styles.row}>
            <View style={Styles.rowText}>
              <Text style={Styles.name}>{device.name}</Text>

              <Text
                style={isConnected ? Styles.connected : Styles.detail}
              >
                {isConnected
                  ? "● Connected"
                  : isConnecting
                    ? "Connecting..."
                    : device.lastConnectedAt
                      ? `Last connected ${formatAge(Date.now() - device.lastConnectedAt.getTime())}`
                      : "Not connected"}
              </Text>
            </View>

            {!isConnected && !isConnecting && (
              <Pressable
                style={Styles.action}
                disabled={atLimit}
                onPress={() =>
                  connect({ id: device.deviceId, name: device.name })
                }
              >
                <Text
                  style={[Styles.actionText, atLimit && Styles.disabled]}
                >
                  Connect
                </Text>
              </Pressable>
            )}

            <Pressable
              style={Styles.action}
              onPress={() => confirmForget(device)}
            >
              <Text style={[Styles.actionText, Styles.forget]}>Forget</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const Styles = StyleSheet.create({
  empty: {
    color: "#666",
    marginTop: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },

  rowText: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
  },

  detail: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  connected: {
    fontSize: 13,
    color: "green",
    marginTop: 2,
  },

  action: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#208AEF",
  },

  forget: {
    color: "red",
  },

  disabled: {
    opacity: 0.4,
  },
});
