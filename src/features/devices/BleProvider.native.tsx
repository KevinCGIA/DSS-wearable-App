import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { State, type Subscription } from 'react-native-ble-plx';
import type { BluetoothState, ConnectionState, PairedDevice, ScannedDevice } from '@/data/types';
import { bleService, describeBluetoothState } from '@/lib/ble/BleService.native';
import { MAX_CONNECTED_DEVICES } from '@/lib/ble/constants';
import { hasBlePermissions, requestBlePermissions } from '@/lib/ble/permissions.native';
import {
  forgetPairedDevice,
  savePairedDevice,
  setAutoConnect as saveAutoConnect,
  subscribeToAutoConnect,
  subscribeToPairedDevices,
} from '@/lib/ble/pairedDevices.native';
import { addSensorReading, clearReadings } from '@/lib/sensors/readings';
import { SENSOR_UID } from '@/lib/sensors/useSensorReadings';
import type { BleContextValue } from './BleProvider';

const BleContext = createContext<BleContextValue | null>(null);
const platform = Platform.OS === 'ios' ? 'ios' : 'android';

const idle: ConnectionState = {
  status: 'disconnected',
  deviceId: null,
  deviceName: null,
  attempt: 0,
  batteryLevel: null,
  error: null,
};

// Real BLE backend (Phase 2 B2): several devices at once, up to MAX_CONNECTED_DEVICES.
// bleService keeps one session per device (its own retries, reconnects and heart rate
// stream), so connecting one device never affects another. `connection` is the device the
// user acted on most recently, for screens that show a single device.
export function BleProvider({ children }: { children: React.ReactNode }) {
  const uid = getAuth().currentUser?.uid ?? null;
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>('Unknown');
  const [isScanning, setIsScanning] = useState(false);
  const [devicesById, setDevicesById] = useState<Record<string, ScannedDevice>>({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [connectionList, setConnectionList] = useState(bleService.getConnections());
  const [latestId, setLatestId] = useState<string | null>(null);
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
  const [pairedLoaded, setPairedLoaded] = useState(false);
  const [autoConnectLoaded, setAutoConnectLoaded] = useState(false);
  const [autoConnect, setAutoConnectState] = useState(true);
  const stateSubscription = useRef<Subscription | null>(null);
  const autoConnectAttempted = useRef(false);
  const pairedRef = useRef(pairedDevices);
  const scannedRef = useRef(devicesById);
  pairedRef.current = pairedDevices;
  scannedRef.current = devicesById;

  const watchBluetoothState = useCallback(() => {
    if (stateSubscription.current) return;
    stateSubscription.current = bleService.onBluetoothStateChange((state) => {
      setBluetoothState(state as BluetoothState);
      if (state === State.PoweredOff) setIsScanning(false);
    });
  }, []);

  const ensureBluetoothReady = useCallback(() => {
    if (Platform.OS === 'ios') {
      // Opening Devices is an intentional point for the iOS Bluetooth prompt.
      watchBluetoothState();
    } else {
      hasBlePermissions().then((granted) => {
        if (granted) watchBluetoothState();
      });
    }
  }, [watchBluetoothState]);

  useEffect(() => {
    clearReadings();
    const unsubscribe = bleService.subscribe(setConnectionList);
    return () => {
      unsubscribe();
      stateSubscription.current?.remove();
      stateSubscription.current = null;
      void bleService.stopScan();
      void bleService.disconnectAll();
      clearReadings();
    };
  }, []);

  useEffect(() => {
    if (!uid) return;
    autoConnectAttempted.current = false;
    setPairedLoaded(false);
    setAutoConnectLoaded(false);
    const unsubscribeDevices = subscribeToPairedDevices(
      uid,
      (devices) => {
        setPairedDevices(devices);
        setPairedLoaded(true);
      },
      () => {
        setScanError("Couldn't load paired devices.");
        setPairedLoaded(true);
      },
    );
    const unsubscribeAutoConnect = subscribeToAutoConnect(
      uid,
      (enabled) => {
        setAutoConnectState(enabled);
        setAutoConnectLoaded(true);
      },
      () => {
        setAutoConnectState(false);
        setAutoConnectLoaded(true);
        setScanError("Couldn't load the auto-connect setting.");
      },
    );
    return () => {
      unsubscribeDevices();
      unsubscribeAutoConnect();
    };
  }, [uid]);

  // This phone's saved devices: Bluetooth IDs from another platform can't be used here
  const eligiblePaired = useCallback(
    () => pairedRef.current.filter((device) => (device.platform ?? 'android') === platform),
    [],
  );

  useEffect(() => {
    // iOS must not show its permission prompt immediately after login unless
    // an eligible saved iOS device should auto-connect.
    if (!pairedLoaded || !autoConnectLoaded || !autoConnect) return;
    if (eligiblePaired().length > 0) ensureBluetoothReady();
  }, [pairedLoaded, autoConnectLoaded, pairedDevices, autoConnect, ensureBluetoothReady, eligiblePaired]);

  // Connects by saved ID. On iOS a stale peripheral UUID falls back to finding the device
  // again by its advertised name and service.
  const connectSaved = useCallback(async (device: { id: string; name: string | null }) => {
    const connected = await bleService.connect(device.id, device.name);
    const paired = pairedRef.current.find((item) => item.deviceId === device.id);
    if (connected || Platform.OS !== 'ios' || paired?.platform !== 'ios' || !paired.serviceUUIDs?.length) {
      return connected;
    }
    const match = await bleService.findMatchingDevice(paired.localName ?? paired.name, paired.serviceUUIDs);
    if (!match) return false;
    scannedRef.current = { ...scannedRef.current, [match.id]: match };
    setDevicesById((previous) => ({ ...previous, [match.id]: match }));
    return bleService.connect(match.id, match.name);
  }, []);

  // Once per login: reconnect every saved device for this phone (up to the limit), most
  // recent first, one at a time since Android connects more reliably that way.
  useEffect(() => {
    if (autoConnectAttempted.current || !pairedLoaded || !autoConnectLoaded || bluetoothState !== 'PoweredOn') return;
    autoConnectAttempted.current = true;
    if (!autoConnect) return;

    void (async () => {
      for (const device of eligiblePaired().slice(0, MAX_CONNECTED_DEVICES)) {
        if (bleService.getConnection(device.deviceId)) continue;
        try {
          await connectSaved({ id: device.deviceId, name: device.name });
        } catch (error) {
          setScanError(String(error));
        }
      }
    })();
  }, [pairedLoaded, autoConnectLoaded, pairedDevices, bluetoothState, autoConnect, connectSaved, eligiblePaired]);

  // Remember every device that connects successfully
  const connectedKey = connectionList
    .filter((c) => c.status === 'connected')
    .map((c) => c.deviceId)
    .join(',');

  useEffect(() => {
    if (!uid) return;
    for (const c of bleService.getConnections()) {
      if (c.status !== 'connected') continue;
      const scanned = scannedRef.current[c.deviceId];
      const previous = pairedRef.current.find((device) => device.deviceId === c.deviceId);
      void savePairedDevice(uid, c.deviceId, c.deviceName ?? 'Unknown device', {
        platform,
        localName: scanned?.name ?? previous?.localName,
        serviceUUIDs: scanned?.serviceUUIDs ?? previous?.serviceUUIDs,
      }).catch(() => setScanError("Couldn't save the paired device."));
    }
  }, [uid, connectedKey]);

  // Every heart rate sample from every connected device, tagged with that device
  useEffect(
    () => bleService.onHeartRate((bpm, deviceId) => {
      const current = bleService.getConnection(deviceId);
      if (current?.status !== 'connected') return;
      void addSensorReading(SENSOR_UID, 'heart_rate', {
        value: bpm,
        deviceId,
        deviceName: current.deviceName,
        source: 'ble',
      });
    }),
    [],
  );

  const startScan = useCallback(async () => {
    setScanError(null);
    try {
      const granted = await requestBlePermissions();
      if (!granted) {
        setBluetoothState('Unauthorized');
        setScanError(describeBluetoothState(State.Unauthorized));
        return;
      }
      watchBluetoothState();
      setDevicesById({});
      setIsScanning(true);
      await bleService.startScan({
        onDevice: (device) => setDevicesById((previous) => ({ ...previous, [device.id]: device })),
        onError: setScanError,
        onStop: () => setIsScanning(false),
      });
    } catch (error) {
      setIsScanning(false);
      setScanError(error instanceof Error ? error.message : String(error));
    }
  }, [watchBluetoothState]);

  const stopScan = useCallback(() => bleService.stopScan(), []);

  const connect = useCallback(async (device: { id: string; name: string | null }) => {
    try {
      const paired = pairedRef.current.find((item) => item.deviceId === device.id);
      if (paired && (paired.platform ?? 'android') !== platform) {
        await startScan();
        return false;
      }
      const granted = await requestBlePermissions();
      if (!granted) {
        setBluetoothState('Unauthorized');
        setScanError(describeBluetoothState(State.Unauthorized));
        return false;
      }
      watchBluetoothState();
      setLatestId(device.id);
      return await connectSaved(device);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : String(error));
      return false;
    }
  }, [startScan, watchBluetoothState, connectSaved]);

  const connections = useMemo(() => {
    const map: Record<string, ConnectionState> = {};
    for (const c of connectionList) map[c.deviceId] = c;
    return map;
  }, [connectionList]);

  // The device acted on most recently, else the newest connection
  const connection = useMemo<ConnectionState>(() => {
    if (latestId && connections[latestId]) return connections[latestId];
    return connectionList.length ? connectionList[connectionList.length - 1] : idle;
  }, [latestId, connections, connectionList]);

  const disconnect = useCallback(async (deviceId?: string) => {
    const target = deviceId ?? connection.deviceId;
    if (!target) return;
    const state = bleService.getConnection(target);
    // A failed attempt has nothing to disconnect; clear its error instead
    if (state?.status === 'disconnected') bleService.dismissError(target);
    else await bleService.disconnect(target);
  }, [connection.deviceId]);

  const forgetDevice = useCallback(async (deviceId: string) => {
    if (!uid) return;
    try {
      await bleService.disconnect(deviceId);
      await forgetPairedDevice(uid, deviceId);
    } catch {
      setScanError("Couldn't forget the paired device.");
    }
  }, [uid]);

  const setAutoConnect = useCallback(async (enabled: boolean) => {
    const previous = autoConnect;
    setAutoConnectState(enabled);
    if (!uid) return;
    try {
      await saveAutoConnect(uid, enabled);
    } catch {
      setAutoConnectState(previous);
      setScanError("Couldn't save the auto-connect setting.");
    }
  }, [uid, autoConnect]);

  const findDeviceByName = useCallback(async (name: string) => {
    if (!(await requestBlePermissions())) return null;
    watchBluetoothState();
    return bleService.findDevice((device) => device.name === name);
  }, [watchBluetoothState]);

  const devices = useMemo(
    () => Object.values(devicesById).sort((a, b) => b.rssi - a.rssi),
    [devicesById],
  );

  const value = useMemo<BleContextValue>(() => ({
    bluetoothState,
    isScanning,
    devices,
    scanError,
    startScan,
    stopScan,
    connection,
    connections,
    connect,
    disconnect,
    pairedDevices,
    forgetDevice,
    autoConnect,
    setAutoConnect,
    simulateDropOut: () => undefined,
    setReadingsPaused: () => undefined,
    pausedDevices: [],
    supportsTestControls: false,
    ensureBluetoothReady,
    findDeviceByName,
  }), [
    bluetoothState, isScanning, devices, scanError, startScan, stopScan, connection, connections,
    connect, disconnect, pairedDevices, forgetDevice, autoConnect, setAutoConnect, ensureBluetoothReady,
    findDeviceByName,
  ]);

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
}

export function useBle(): BleContextValue {
  const context = useContext(BleContext);
  if (!context) throw new Error('useBle must be used inside BleProvider');
  return context;
}
