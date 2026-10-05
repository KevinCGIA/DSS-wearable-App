import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { State, type Subscription } from 'react-native-ble-plx';
import type { BluetoothState, ConnectionState, PairedDevice, ScannedDevice } from '@/data/types';
import { bleService, describeBluetoothState } from '@/lib/ble/BleService.native';
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
import { subscribeWithDeadline, withDeadline } from '@/lib/asyncDeadline';

const BleContext = createContext<BleContextValue | null>(null);
const platform = Platform.OS === 'ios' ? 'ios' : 'android';

// Kevin's single-connection service is the native backend for B1. The public
// context retains Tarun's multi-device shape; B2 replaces this backend map.
export function BleProvider({ children }: { children: React.ReactNode }) {
  const uid = getAuth().currentUser?.uid ?? null;
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>('Unknown');
  const [isScanning, setIsScanning] = useState(false);
  const [devicesById, setDevicesById] = useState<Record<string, ScannedDevice>>({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>(bleService.getConnectionState());
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
    const unsubscribe = bleService.subscribe(setConnection);
    return () => {
      unsubscribe();
      stateSubscription.current?.remove();
      stateSubscription.current = null;
      void bleService.stopScan();
      void bleService.disconnect();
      clearReadings();
    };
  }, []);

  useEffect(() => {
    if (!uid) return;
    autoConnectAttempted.current = false;
    setPairedLoaded(false);
    setAutoConnectLoaded(false);
    const unsubscribeDevices = subscribeWithDeadline<PairedDevice[]>(
      (onData, onError) => subscribeToPairedDevices(uid, onData, onError),
      (devices) => {
        setPairedDevices(devices);
        setPairedLoaded(true);
      },
      () => {
        setScanError("Couldn't load paired devices.");
        setPairedLoaded(true);
      },
    );
    const unsubscribeAutoConnect = subscribeWithDeadline<boolean>(
      (onData, onError) => subscribeToAutoConnect(uid, onData, onError),
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

  useEffect(() => {
    // iOS must not show its permission prompt immediately after login unless
    // an eligible saved iOS device should auto-connect.
    if (!pairedLoaded || !autoConnectLoaded || !autoConnect) return;
    const eligible = pairedDevices.find((device) => (device.platform ?? 'android') === platform);
    if (eligible) ensureBluetoothReady();
  }, [pairedLoaded, autoConnectLoaded, pairedDevices, autoConnect, ensureBluetoothReady]);

  useEffect(() => {
    if (autoConnectAttempted.current || !pairedLoaded || !autoConnectLoaded || bluetoothState !== 'PoweredOn') return;
    autoConnectAttempted.current = true;
    const latest = pairedDevices.find((device) => (device.platform ?? 'android') === platform);
    if (autoConnect && latest && bleService.getConnectionState().status === 'disconnected') {
      void bleService.connect(latest.deviceId, latest.name).then(async (connected) => {
        if (connected || Platform.OS !== 'ios' || !latest.serviceUUIDs?.length) return;
        const match = await bleService.findMatchingDevice(latest.localName ?? latest.name, latest.serviceUUIDs);
        if (match) {
          scannedRef.current = { ...scannedRef.current, [match.id]: match };
          setDevicesById((previous) => ({ ...previous, [match.id]: match }));
          await bleService.connect(match.id, match.name);
        }
      }).catch((error) => setScanError(String(error)));
    }
  }, [pairedLoaded, autoConnectLoaded, pairedDevices, bluetoothState, autoConnect]);

  useEffect(() => {
    if (!uid || connection.status !== 'connected' || !connection.deviceId) return;
    if (connection.error) setScanError(connection.error);
    const scanned = scannedRef.current[connection.deviceId];
    const previous = pairedRef.current.find((device) => device.deviceId === connection.deviceId);
    void savePairedDevice(uid, connection.deviceId, connection.deviceName ?? 'Unknown device', {
      platform,
      localName: scanned?.name ?? previous?.localName,
      serviceUUIDs: scanned?.serviceUUIDs ?? previous?.serviceUUIDs,
    }).catch(() => setScanError("Couldn't save the paired device."));
  }, [uid, connection.status, connection.deviceId, connection.deviceName]);

  useEffect(
    () => bleService.onHeartRate((bpm) => {
      const current = bleService.getConnectionState();
      if (current.status !== 'connected' || !current.deviceId) return;
      void addSensorReading(SENSOR_UID, 'heart_rate', {
        value: bpm,
        deviceId: current.deviceId,
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
      const connected = await bleService.connect(device.id, device.name);
      if (connected || Platform.OS !== 'ios' || paired?.platform !== 'ios' || !paired.serviceUUIDs?.length) {
        return connected;
      }
      const match = await bleService.findMatchingDevice(paired.localName ?? paired.name, paired.serviceUUIDs);
      if (!match) return false;
      scannedRef.current = { ...scannedRef.current, [match.id]: match };
      setDevicesById((previous) => ({ ...previous, [match.id]: match }));
      return bleService.connect(match.id, match.name);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : String(error));
      return false;
    }
  }, [startScan, watchBluetoothState]);

  const disconnect = useCallback(async (deviceId?: string) => {
    const active = bleService.getConnectionState().deviceId;
    if (!deviceId || deviceId === active) await bleService.disconnect();
  }, []);

  const forgetDevice = useCallback(async (deviceId: string) => {
    if (!uid) return;
    try {
      if (bleService.getConnectionState().deviceId === deviceId) await bleService.disconnect();
      await withDeadline(forgetPairedDevice(uid, deviceId));
    } catch {
      setScanError("Couldn't forget the paired device.");
    }
  }, [uid]);

  const setAutoConnect = useCallback(async (enabled: boolean) => {
    const previous = autoConnect;
    setAutoConnectState(enabled);
    if (!uid) return;
    try {
      await withDeadline(saveAutoConnect(uid, enabled));
    } catch {
      setAutoConnectState(previous);
      setScanError("Couldn't save the auto-connect setting.");
    }
  }, [uid, autoConnect]);

  const devices = useMemo(
    () => Object.values(devicesById).sort((a, b) => b.rssi - a.rssi),
    [devicesById],
  );
  const connections = useMemo(
    () => connection.deviceId ? { [connection.deviceId]: connection } : {},
    [connection],
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
  }), [
    bluetoothState, isScanning, devices, scanError, startScan, stopScan, connection, connections,
    connect, disconnect, pairedDevices, forgetDevice, autoConnect, setAutoConnect, ensureBluetoothReady,
  ]);

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
}

export function useBle(): BleContextValue {
  const context = useContext(BleContext);
  if (!context) throw new Error('useBle must be used inside BleProvider');
  return context;
}
