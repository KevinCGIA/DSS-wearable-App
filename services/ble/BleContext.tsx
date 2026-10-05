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

import { getInstallationId } from "../devices/installationId";
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
import {
  HEART_RATE_SAVE_INTERVAL_MS,
  MAX_CONNECTED_DEVICES,
} from "./constants";
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
  // Every device that is connected, connecting, or whose last attempt
  // failed (status "disconnected" with an error)
  connections: ConnectionState[];
  connect: (device: { id: string; name: string | null }) => Promise<boolean>;
  disconnect: (deviceId: string) => Promise<void>;
  dismissError: (deviceId: string) => void;
  // This phone's paired devices, most recent first
  pairedDevices: PairedDevice[];
  forgetDevice: (device: PairedDevice) => Promise<void>;
  // Reconnect to paired devices when the app opens
  autoConnect: boolean;
  setAutoConnect: (enabled: boolean) => Promise<void>;
};

export type LiveHeartRate = {
  bpm: number;
  deviceId: string;
  deviceName: string | null;
  // ms since epoch
  receivedAt: number;
};

const BleContext = createContext<BleContextValue | null>(null);

// Separate from BleContext because it updates about once a second; only
// heart rate displays should re-render that often
const LiveHeartRateContext = createContext<LiveHeartRate | null>(null);

// Holds BLE state for the logged-in part of the app, so any screen
// (Home, the Devices screen, Settings) sees the same connections.
export function BleProvider({ children }: { children: ReactNode }) {
  const [bluetoothState, setBluetoothState] = useState<State>(
    State.Unknown
  );
  const [isScanning, setIsScanning] = useState(false);
  const [devicesById, setDevicesById] = useState<
    Record<string, ScannedDevice>
  >({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionState[]>(
    bleService.getConnections()
  );
  const [liveHeartRate, setLiveHeartRate] =
    useState<LiveHeartRate | null>(null);
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
  const [pairedLoaded, setPairedLoaded] = useState(false);
  const [autoConnect, setAutoConnectState] = useState(true);
  const autoConnectAttempted = useRef(false);

  useEffect(() => {
    const unsubscribe = bleService.subscribe(setConnections);

    return () => {
      unsubscribe();

      // Leaving the logged-in area (logout) drops all devices
      bleService.stopScan();
      bleService.disconnectAll();
    };
  }, []);

  useEffect(() => {
    getInstallationId()
      .then(setInstallationId)
      .catch((e) => {
        console.log("Failed to load installation ID:", e);
        setPairedLoaded(true);
      });
  }, []);

  useEffect(() => {
    const user = getAuth().currentUser;

    if (!user || !installationId) {
      return;
    }

    const unsubscribeDevices = subscribeToPairedDevices(
      user.uid,
      installationId,
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
  }, [installationId]);

  // Remember every device that connects successfully
  const connectedKey = connections
    .filter((c) => c.status === "connected")
    .map((c) => c.deviceId)
    .join(",");

  useEffect(() => {
    const user = getAuth().currentUser;

    if (!user || !installationId) {
      return;
    }

    for (const c of bleService.getConnections()) {
      if (c.status === "connected") {
        savePairedDevice(
          user.uid,
          installationId,
          c.deviceId,
          c.deviceName ?? "Unknown device"
        ).catch((e) => console.log("Failed to save paired device:", e));
      }
    }
  }, [connectedKey, installationId]);

  // Show heart rate live, and save it to Firestore at most once per
  // interval per device
  useEffect(() => {
    const lastSavedAt = new Map<string, number>();

    return bleService.onHeartRate((bpm, deviceId) => {
      const now = Date.now();
      const deviceName =
        bleService.getConnection(deviceId)?.deviceName ?? null;

      setLiveHeartRate({ bpm, deviceId, deviceName, receivedAt: now });

      const user = getAuth().currentUser;

      if (
        !user ||
        now - (lastSavedAt.get(deviceId) ?? 0) < HEART_RATE_SAVE_INTERVAL_MS
      ) {
        return;
      }

      lastSavedAt.set(deviceId, now);

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

  // Once per login: reconnect to this phone's paired devices, most recent
  // first. Waits for Bluetooth to report PoweredOn, which only happens once
  // permission has been granted, so this never triggers a permission
  // prompt by itself. One at a time, since Android connects more reliably
  // that way.
  useEffect(() => {
    if (
      autoConnectAttempted.current ||
      !pairedLoaded ||
      bluetoothState !== State.PoweredOn
    ) {
      return;
    }

    autoConnectAttempted.current = true;

    if (!autoConnect) {
      return;
    }

    (async () => {
      for (const device of pairedDevices.slice(0, MAX_CONNECTED_DEVICES)) {
        if (!bleService.getConnection(device.deviceId)) {
          await bleService.connect(device.deviceId, device.name);
        }
      }
    })();
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
  }, [watchBluetoothState]);

  const stopScan = useCallback(() => bleService.stopScan(), []);

  const connect = useCallback(
    async (device: { id: string; name: string | null }) => {
      // Connecting from Settings or an NFC tag can happen before any scan,
      // so make sure permissions are granted first
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

  const disconnect = useCallback(
    (deviceId: string) => bleService.disconnect(deviceId),
    []
  );

  const dismissError = useCallback(
    (deviceId: string) => bleService.dismissError(deviceId),
    []
  );

  const forgetDevice = useCallback(async (device: PairedDevice) => {
    const user = getAuth().currentUser;

    if (!user) {
      return;
    }

    await bleService.disconnect(device.deviceId);
    await forgetPairedDevice(user.uid, device.docId);
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
      connections,
      connect,
      disconnect,
      dismissError,
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
      connections,
      connect,
      disconnect,
      dismissError,
      pairedDevices,
      forgetDevice,
      autoConnect,
      setAutoConnect,
    ]
  );

  return (
    <BleContext.Provider value={value}>
      <LiveHeartRateContext.Provider value={liveHeartRate}>
        {children}
      </LiveHeartRateContext.Provider>
    </BleContext.Provider>
  );
}

export function useBle(): BleContextValue {
  const context = useContext(BleContext);

  if (!context) {
    throw new Error("useBle must be used inside BleProvider");
  }

  return context;
}

// The most recent heart rate received over Bluetooth from any connected
// device, or null if none has been received since login
export function useLiveHeartRate(): LiveHeartRate | null {
  return useContext(LiveHeartRateContext);
}

// Connections that are connected or in progress (not failed attempts)
export function activeConnections(connections: ConnectionState[]) {
  return connections.filter((c) => c.status !== "disconnected");
}
