import { Pressable, StyleSheet, Text, View } from "react-native";

import { useBle } from "../services/ble/BleContext";
import { ConnectionState } from "../services/ble/BleService";

// Every connected or connecting device, plus failed attempts with their
// error, each with its own Disconnect / Cancel / Dismiss button
export default function ConnectedDeviceList() {
  const { connections, disconnect, dismissError } = useBle();

  if (connections.length === 0) {
    return (
      <View style={Styles.card}>
        <Text style={Styles.empty}>No devices connected</Text>
      </View>
    );
  }

  return (
    <View style={Styles.card}>
      {connections.map((connection, i) => (
        <View
          key={connection.deviceId}
          style={[Styles.row, i > 0 && Styles.rowDivider]}
        >
          <View style={Styles.rowText}>
            <Text style={Styles.name}>
              {connection.deviceName ?? "Unknown device"}
            </Text>

            <StatusText connection={connection} />
          </View>

          {connection.status !== "disconnecting" && (
            <Pressable
              style={Styles.action}
              onPress={() =>
                connection.status === "disconnected"
                  ? dismissError(connection.deviceId)
                  : disconnect(connection.deviceId)
              }
            >
              <Text
                style={[
                  Styles.actionText,
                  connection.status !== "disconnected" && Styles.destructive,
                ]}
              >
                {connection.status === "connected"
                  ? "Disconnect"
                  : connection.status === "disconnected"
                    ? "Dismiss"
                    : "Cancel"}
              </Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

function StatusText({ connection }: { connection: ConnectionState }) {
  const { status, attempt, batteryLevel, error } = connection;

  switch (status) {
    case "connected":
      return (
        <Text style={Styles.connected}>
          ● Connected
          {batteryLevel !== null ? ` · 🔋 ${batteryLevel}%` : ""}
        </Text>
      );
    case "connecting":
      return (
        <Text style={Styles.pending}>
          Connecting{attempt > 1 ? ` (attempt ${attempt})` : ""}...
        </Text>
      );
    case "reconnecting":
      return (
        <Text style={Styles.pending}>
          Connection lost, reconnecting (attempt {attempt})...
        </Text>
      );
    case "discovering":
      return <Text style={Styles.pending}>Setting up device...</Text>;
    case "disconnecting":
      return <Text style={Styles.pending}>Disconnecting...</Text>;
    case "disconnected":
      return <Text style={Styles.error}>{error ?? "Not connected"}</Text>;
  }
}

const Styles = StyleSheet.create({
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },

  empty: {
    fontSize: 15,
    color: "#666",
    paddingVertical: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
  },

  rowText: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "bold",
  },

  connected: {
    fontSize: 14,
    color: "green",
    marginTop: 2,
  },

  pending: {
    fontSize: 14,
    color: "#b26a00",
    marginTop: 2,
  },

  error: {
    fontSize: 14,
    color: "red",
    marginTop: 2,
  },

  action: {
    paddingLeft: 10,
    paddingVertical: 6,
  },

  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#208AEF",
  },

  destructive: {
    color: "red",
  },
});
