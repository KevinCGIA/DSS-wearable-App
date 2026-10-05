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

import ConnectedDeviceList from "../../components/ConnectedDeviceList";
import NfcPairingCard from "../../components/NfcPairingCard";
import { activeConnections, useBle } from "../../services/ble/BleContext";
import {
  ConnectionState,
  describeBluetoothState,
  ScannedDevice,
} from "../../services/ble/BleService";
import { MAX_CONNECTED_DEVICES } from "../../services/ble/constants";

export default function Devices() {
  const router = useRouter();
  const {
    bluetoothState,
    isScanning,
    devices,
    scanError,
    startScan,
    stopScan,
    connections,
    connect,
  } = useBle();

  // Stop scanning when leaving the screen to save battery
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  const atLimit =
    activeConnections(connections).length >= MAX_CONNECTED_DEVICES;

  const bluetoothProblem =
    bluetoothState !== State.PoweredOn &&
    bluetoothState !== State.Unknown
      ? describeBluetoothState(bluetoothState)
      : null;

  // Everything above the scan results scrolls with the list, so nothing
  // gets squeezed on small screens
  const header = (
    <>
      <View style={Styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={Styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={Styles.title}>Devices</Text>
      </View>

      <Text style={[Styles.sectionTitle, Styles.connectedTitle]}>
        Connected devices
      </Text>

      <ConnectedDeviceList />

      <NfcPairingCard />

      <View style={[Styles.scanRow, Styles.nearbyTitle]}>
        <Text style={Styles.sectionTitle}>Nearby devices</Text>

        {isScanning && <ActivityIndicator size="small" />}
      </View>

      {bluetoothProblem && (
        <Text style={Styles.warning}>{bluetoothProblem}</Text>
      )}

      {scanError && !bluetoothProblem && (
        <Text style={Styles.warning}>{scanError}</Text>
      )}

      <Button
        title={isScanning ? "Stop Scanning" : "Scan for Devices"}
        onPress={isScanning ? stopScan : startScan}
      />

      {atLimit && (
        <Text style={Styles.limitText}>
          {MAX_CONNECTED_DEVICES} devices connected, the most at once.
          Disconnect one to add another.
        </Text>
      )}
    </>
  );

  return (
    <FlatList
      style={Styles.screen}
      contentContainerStyle={Styles.container}
      data={devices}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      ListHeaderComponentStyle={Styles.listHeader}
      renderItem={({ item }) => (
        <DeviceRow
          device={item}
          connection={connections.find((c) => c.deviceId === item.id)}
          atLimit={atLimit}
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
  );
}

function DeviceRow({
  device,
  connection,
  atLimit,
  onPress,
}: {
  device: ScannedDevice;
  // Present if this device is connected, connecting or just failed
  connection: ConnectionState | undefined;
  atLimit: boolean;
  onPress: () => void;
}) {
  const isActive = !!connection && connection.status !== "disconnected";
  const disabled = isActive || atLimit;

  return (
    <Pressable
      style={[Styles.row, disabled && !isActive && Styles.rowDisabled]}
      onPress={onPress}
      disabled={disabled}
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
        {connection?.status === "connected"
          ? "Connected"
          : isActive
            ? "Connecting..."
            : "Connect"}
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
  screen: {
    flex: 1,
  },

  container: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  listHeader: {
    marginBottom: 10,
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







  warning: {
    backgroundColor: "#fff4e5",
    color: "#8a4b00",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },

  connectedTitle: {
    marginBottom: 10,
  },

  nearbyTitle: {
    marginTop: 20,
  },

  limitText: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
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
