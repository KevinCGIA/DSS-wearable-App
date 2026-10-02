import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getAuth } from "@react-native-firebase/auth";
import { State, Subscription } from "react-native-ble-plx";

import {
  forgetPairedDevice,
  PairedDevice,
  savePairedDevice,
  setAutoConnect as saveAutoConnect,
  subscribeToAutoConnect,
  subscribeToPairedDevices,
} from "../devices/pairedDevices";
import { addSensorReading } from "../sensors/readings";

import {
  bleService,
  ConnectionState,
  describeBluetoothState,
  ScannedDevice,
} from "./BleService";
import { HEART_RATE_SAVE_INTERVAL_MS } from "./constants";
import {
  hasBlePermissions,
  requestBlePermissions,
} from "./permissions";

type BleContextValue = {
  bluetoothState: State;
  isScanning: boolean;
  // Sorted strongest signal first
  devices: ScannedDevice[];
  scanError: string | null;
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  connection: ConnectionState;
  connect: (device: { id: string; name: string | null }) => Promise<boolean>;
  disconnect: () => Promise<void>;
  // Devices this account has connected to before, most recent first
  pairedDevices: PairedDevice[];
  forgetDevice: (deviceId: string) => Promise<void>;
  // Reconnect to the most recent paired device when the app opens
  autoConnect: boolean;
  setAutoConnect: (enabled: boolean) => Promise<void>;
};

const BleContext = createContext<BleContextValue | null>(null);

// Holds BLE state for the logged-in part of the app, so any screen
// (Home, the Devices screen, Settings) sees the same connection.
export function BleProvider({ children }: { children: ReactNode }) {
  const [bluetoothState, setBluetoothState] = useState<State>(
    State.Unknown
  );
  const [isScanning, setIsScanning] = useState(false);
  const [devicesById, setDevicesById] = useState<
    Record<string, ScannedDevice>
  >({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>(
    bleService.getConnectionState()
  );
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
  const [pairedLoaded, setPairedLoaded] = useState(false);
  const [autoConnect, setAutoConnectState] = useState(true);
  const autoConnectAttempted = useRef(false);

  useEffect(() => {
    const user = getAuth().currentUser;

    if (!user) {
      return;
    }

    const unsubscribeDevices = subscribeToPairedDevices(
      user.uid,
      (devices) => {
        setPairedDevices(devices);
        setPairedLoaded(true);
      },
      (e) => {
        console.log("Failed to load paired devices:", e);
        setPairedLoaded(true);
      }
    );
    const unsubscribeAutoConnect = subscribeToAutoConnect(
      user.uid,
      setAutoConnectState
    );

    return () => {
      unsubscribeDevices();
      unsubscribeAutoConnect();
    };
  }, []);

  // Remember every device that connects successfully
  useEffect(() => {
    const user = getAuth().currentUser;
    const { status, deviceId, deviceName } = connection;

    if (!user || status !== "connected" || !deviceId) {
      return;
    }

    savePairedDevice(user.uid, deviceId, deviceName ?? "Unknown device").catch(
      (e) => console.log("Failed to save paired device:", e)
    );
  }, [connection.status, connection.deviceId]);

  useEffect(() => {
    const unsubscribe = bleService.subscribe(setConnection);

    return () => {
      unsubscribe();

      // Leaving the logged-in area (logout) drops the device
      bleService.stopScan();
      bleService.disconnect();
    };
  }, []);

  // Save heart rate from the connected device to Firestore, throttled
  useEffect(() => {
    let lastSavedAt = 0;

    return bleService.onHeartRate((bpm) => {
      const user = getAuth().currentUser;
      const now = Date.now();

      if (!user || now - lastSavedAt < HEART_RATE_SAVE_INTERVAL_MS) {
        return;
      }

      lastSavedAt = now;
      const { deviceId, deviceName } = bleService.getConnectionState();

      addSensorReading(user.uid, "heart_rate", {
        value: bpm,
        timestamp: new Date(now),
        deviceId,
        deviceName,
        source: "ble",
      }).catch((e) => {
        console.log("Failed to save heart rate reading:", e);
      });
    });
  }, []);

  const stateSubscription = useRef<Subscription | null>(null);

  // Needs permission first: on Android 12+ reading the adapter state
  // without BLUETOOTH_CONNECT fails
  const watchBluetoothState = useCallback(() => {
    if (stateSubscription.current) {
      return;
    }

    stateSubscription.current = bleService.onBluetoothStateChange(
      (state) => {
        setBluetoothState(state);

        if (state === State.PoweredOff) {
          setIsScanning(false);
        }
      }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Don't prompt here; that waits until the user starts a scan
    hasBlePermissions().then((granted) => {
      if (!cancelled && granted) {
        watchBluetoothState();
      }
    });

    return () => {
      cancelled = true;
      stateSubscription.current?.remove();
      stateSubscription.current = null;
    };
  }, [watchBluetoothState]);

  // Once per login: reconnect to the most recent paired device. Waits for
  // Bluetooth to report PoweredOn, which only happens once permission has
  // been granted, so this never triggers a permission prompt by itself.
  useEffect(() => {
    const lastDevice = pairedDevices[0];

    if (
      autoConnectAttempted.current ||
      !pairedLoaded ||
      bluetoothState !== State.PoweredOn
    ) {
      return;
    }

    autoConnectAttempted.current = true;

    if (
      autoConnect &&
      lastDevice &&
      bleService.getConnectionState().status === "disconnected"
    ) {
      bleService.connect(lastDevice.deviceId, lastDevice.name);
    }
  }, [pairedLoaded, pairedDevices, bluetoothState, autoConnect]);

  const startScan = useCallback(async () => {
    setScanError(null);

    const granted = await requestBlePermissions();

    if (!granted) {
      setBluetoothState(State.Unauthorized);
      setScanError(describeBluetoothState(State.Unauthorized));
      return;
    }

    watchBluetoothState();

    setDevicesById({});
    setIsScanning(true);

    try {
      await bleService.startScan({
        onDevice: (device) => {
          setDevicesById((current) => ({
            ...current,
            [device.id]: device,
          }));
        },
        onError: setScanError,
        onStop: () => setIsScanning(false),
      });
    } catch (e: any) {
      setIsScanning(false);
      setScanError(e.message);
    }
  }, []);

  const stopScan = useCallback(() => bleService.stopScan(), []);

  const connect = useCallback(
    async (device: { id: string; name: string | null }) => {
      // Connecting from Settings can happen before any scan, so make
      // sure permissions are granted first
      const granted = await requestBlePermissions();

      if (!granted) {
        setBluetoothState(State.Unauthorized);
        return false;
      }

      watchBluetoothState();
      return bleService.connect(device.id, device.name);
    },
    [watchBluetoothState]
  );

  const disconnect = useCallback(() => bleService.disconnect(), []);

  const forgetDevice = useCallback(async (deviceId: string) => {
    const user = getAuth().currentUser;

    if (!user) {
      return;
    }

    if (bleService.getConnectionState().deviceId === deviceId) {
      await bleService.disconnect();
    }

    await forgetPairedDevice(user.uid, deviceId);
  }, []);

  const setAutoConnect = useCallback(async (enabled: boolean) => {
    const user = getAuth().currentUser;

    if (!user) {
      return;
    }

    // Update the switch right away; the listener confirms it after saving
    setAutoConnectState(enabled);
    await saveAutoConnect(user.uid, enabled);
  }, []);

  const devices = useMemo(
    () =>
      Object.values(devicesById).sort((a, b) => b.rssi - a.rssi),
    [devicesById]
  );

  const value = useMemo(
    () => ({
      bluetoothState,
      isScanning,
      devices,
      scanError,
      startScan,
      stopScan,
      connection,
      connect,
      disconnect,
      pairedDevices,
      forgetDevice,
      autoConnect,
      setAutoConnect,
    }),
    [
      bluetoothState,
      isScanning,
      devices,
      scanError,
      startScan,
      stopScan,
      connection,
      connect,
      disconnect,
      pairedDevices,
      forgetDevice,
      autoConnect,
      setAutoConnect,
    ]
  );

  return (
    <BleContext.Provider value={value}>{children}</BleContext.Provider>
  );
}

export function useBle(): BleContextValue {
  const context = useContext(BleContext);

  if (!context) {
    throw new Error("useBle must be used inside BleProvider");
  }

  return context;
}
