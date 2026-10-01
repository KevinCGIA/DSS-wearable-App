import { useEffect } from "react";
import { useRouter } from "expo-router";

import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { State } from "react-native-ble-plx";

import { useBle } from "../../services/ble/BleContext";
import {
  ConnectionState,
  describeBluetoothState,
  ScannedDevice,
} from "../../services/ble/BleService";

export default function Devices() {
  const router = useRouter();
  const {
    bluetoothState,
    isScanning,
    devices,
    scanError,
    startScan,
    stopScan,
    connection,
    connect,
    disconnect,
  } = useBle();

  // Stop scanning when leaving the screen to save battery
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  const isBusy =
    connection.status !== "disconnected" &&
    connection.status !== "connected";

  const bluetoothProblem =
    bluetoothState !== State.PoweredOn &&
    bluetoothState !== State.Unknown
      ? describeBluetoothState(bluetoothState)
      : null;

  return (
    <View style={Styles.container}>
      <View style={Styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={Styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={Styles.title}>Devices</Text>
      </View>

      <ConnectionCard
        connection={connection}
        onDisconnect={disconnect}
      />

      {bluetoothProblem && (
        <Text style={Styles.warning}>{bluetoothProblem}</Text>
      )}

      {scanError && !bluetoothProblem && (
        <Text style={Styles.warning}>{scanError}</Text>
      )}

      <View style={Styles.scanRow}>
        <Text style={Styles.sectionTitle}>Nearby devices</Text>

        {isScanning && <ActivityIndicator size="small" />}
      </View>

      <Button
        title={isScanning ? "Stop Scanning" : "Scan for Devices"}
        onPress={isScanning ? stopScan : startScan}
        disabled={isBusy}
      />

      <FlatList
        style={Styles.list}
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DeviceRow
            device={item}
            isCurrent={item.id === connection.deviceId}
            disabled={isBusy}
            onPress={() => connect(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={Styles.emptyText}>
            {isScanning
              ? "Looking for devices..."
              : "Make sure your watch has Bluetooth on and is nearby, then tap Scan."}
          </Text>
        }
      />
    </View>
  );
}

function ConnectionCard({
  connection,
  onDisconnect,
}: {
  connection: ConnectionState;
  onDisconnect: () => void;
}) {
  const { status, deviceName, attempt, batteryLevel, error } =
    connection;

  if (status === "disconnected") {
    return (
      <View style={Styles.card}>
        <Text style={Styles.cardTitle}>No device connected</Text>

        {error && <Text style={Styles.errorText}>{error}</Text>}
      </View>
    );
  }

  const statusText: Record<typeof status, string> = {
    connecting: `Connecting (attempt ${attempt})...`,
    reconnecting: `Connection lost, reconnecting (attempt ${attempt})...`,
    discovering: "Setting up device...",
    connected: "● Connected",
    disconnecting: "Disconnecting...",
  };

  return (
    <View style={Styles.card}>
      <Text style={Styles.cardTitle}>{deviceName ?? "Unknown device"}</Text>

      <Text
        style={
          status === "connected" ? Styles.connectedText : Styles.pendingText
        }
      >
        {statusText[status]}
      </Text>

      {status === "connected" && batteryLevel !== null && (
        <Text style={Styles.smallText}>🔋 {batteryLevel}%</Text>
      )}

      {status !== "disconnecting" && (
        <View style={Styles.cardButton}>
          <Button
            title={status === "connected" ? "Disconnect" : "Cancel"}
            color="red"
            onPress={onDisconnect}
          />
        </View>
      )}
    </View>
  );
}

function DeviceRow({
  device,
  isCurrent,
  disabled,
  onPress,
}: {
  device: ScannedDevice;
  isCurrent: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[Styles.row, disabled && Styles.rowDisabled]}
      onPress={onPress}
      disabled={disabled || isCurrent}
    >
      <View style={Styles.rowText}>
        <Text style={Styles.deviceName}>
          {device.isHeartRateDevice ? "❤️ " : ""}
          {device.name}
        </Text>

        <Text style={Styles.smallText}>
          {signalLabel(device.rssi)} · {device.rssi} dBm
        </Text>
      </View>

      <Text style={Styles.rowAction}>
        {isCurrent ? "Current" : "Connect"}
      </Text>
    </Pressable>
  );
}

function signalLabel(rssi: number) {
  if (rssi >= -60) return "Strong signal";
  if (rssi >= -80) return "Good signal";
  return "Weak signal";
}

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },

  header: {
    marginBottom: 15,
  },

  back: {
    fontSize: 16,
    color: "#208AEF",
    marginBottom: 8,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 6,
  },

  cardButton: {
    marginTop: 10,
  },

  connectedText: {
    fontSize: 14,
    color: "green",
  },

  pendingText: {
    fontSize: 14,
    color: "#b26a00",
  },

  errorText: {
    fontSize: 14,
    color: "red",
  },

  warning: {
    backgroundColor: "#fff4e5",
    color: "#8a4b00",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },

  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  list: {
    flex: 1,
    marginTop: 10,
  },

  emptyText: {
    color: "#666",
    textAlign: "center",
    marginTop: 30,
    paddingHorizontal: 20,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },

  rowDisabled: {
    opacity: 0.5,
  },

  rowText: {
    flex: 1,
  },

  deviceName: {
    fontSize: 16,
    fontWeight: "600",
  },

  rowAction: {
    fontSize: 15,
    color: "#208AEF",
    fontWeight: "600",
  },

  smallText: {
    color: "#666",
    marginTop: 3,
  },
});
