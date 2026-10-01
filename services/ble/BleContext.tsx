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

import { State, Subscription } from "react-native-ble-plx";

import {
  bleService,
  ConnectionState,
  describeBluetoothState,
  ScannedDevice,
} from "./BleService";
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
  connect: (device: ScannedDevice) => Promise<boolean>;
  disconnect: () => Promise<void>;
};

const BleContext = createContext<BleContextValue | null>(null);

// Holds BLE state for the logged-in part of the app, so any screen
// (Home, the device screen, later Settings) sees the same connection.
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

  useEffect(() => {
    const unsubscribe = bleService.subscribe(setConnection);

    return () => {
      unsubscribe();

      // Leaving the logged-in area (logout) drops the device
      bleService.stopScan();
      bleService.disconnect();
    };
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
    (device: ScannedDevice) =>
      bleService.connect(device.id, device.name),
    []
  );

  const disconnect = useCallback(() => bleService.disconnect(), []);

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
