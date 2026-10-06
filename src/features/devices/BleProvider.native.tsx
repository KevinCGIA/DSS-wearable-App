import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { nativeAuthService } from '@/features/auth/nativeAuthService';
import { deviceKey, nativeDeviceId } from '@/lib/ble/deviceKey';
import { MAX_CONNECTED_DEVICES } from '@/lib/ble/constants';
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
import { addSensorReading, startReadingSession, flushReadings } from '@/lib/sensors/readings.native';
import { SENSOR_UID } from '@/lib/sensors/useSensorReadings';
import type { BleContextValue } from './BleProvider';
import { subscribeWithDeadline, withDeadline } from '@/lib/asyncDeadline';
import { logConnectionEvent, startConnectionLog } from '@/lib/devices/connectionLog.native';
import { usePreferences } from '@/features/preferences/PreferencesProvider';
import { subscribeToAlertThresholds } from '@/lib/alerts/thresholds.native';
import { checkHeartRate, alertCooldownKey } from '@/lib/alerts/heartRateAlert';
import { addAlert } from '@/lib/alerts/alertHistory.native';
import { presentHeartRateAlert } from '@/lib/alerts/localNotification.native';
import { onLiveReading } from '@/lib/sensors/readings.native';
import type { AlertThresholds } from '@/data/types';

const BleContext = createContext<BleContextValue | null>(null);
const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';

export function BleProvider({ children }: { children: React.ReactNode }) {
  const { preferences, loaded: preferencesLoaded } = usePreferences();
  const [uid, setUid] = useState<string | null>(getAuth().currentUser?.uid ?? null);
  useEffect(() => nativeAuthService.subscribe((user) => setUid(user?.uid ?? null)), []);
  const [bluetoothState, setBluetoothState] = useState<BluetoothState>('Unknown');
  const [isScanning, setIsScanning] = useState(false);
  const [devicesById, setDevicesById] = useState<Record<string, ScannedDevice>>({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, ConnectionState>>({});
  const connection = bleService.getConnectionState();
  const reset = useRef(Promise.resolve());
  const ownerReady = useRef(false);
  const requests = useRef(new Map<string, number>());
  const previousStatuses = useRef<Record<string, string>>({});
  const savedMetadata = useRef<Record<string, string>>({});
  const lastAlerts = useRef(new Map<string, number>());
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
    let activeOwner = true;
    ownerReady.current = false;
    if (uid) void reset.current.then(() => { if (activeOwner && getAuth().currentUser?.uid === uid) ownerReady.current = true; });
    const stopLog = uid ? startConnectionLog(uid, setScanError) : () => {};
    const stopEvents = bleService.onConnectionEvent((event) => { if (uid && ownerReady.current) logConnectionEvent(event); });
    const stopReadings = uid ? startReadingSession(uid, (error) => {
      setScanError(error.message);
      void bleService.disconnectAll();
    }) : () => {};
    setConnections({});
    previousStatuses.current = {};
    savedMetadata.current = {};
    lastAlerts.current.clear();
    const unsubscribe = bleService.subscribe(setConnections);
    return () => {
      activeOwner = false;
      ownerReady.current = false;
      unsubscribe();
      stopEvents();
      for (const [deviceId, state] of Object.entries(bleService.getConnections())) {
        if (state.status === 'connected') logConnectionEvent({ type: 'disconnected', deviceId, reason: 'user' });
      }
      stateSubscription.current?.remove();
      stateSubscription.current = null;
      void bleService.stopScan();
      requests.current.forEach((value, key) => requests.current.set(key, value + 1));
      reset.current = bleService.disconnectAll();
      stopReadings();
      stopLog();
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void bleService.pollRssi();
    }, 10000);
    return () => clearInterval(timer);
  }, [uid]);

  useEffect(() => {
    setPairedDevices([]);
    if (!uid) return;
    autoConnectAttempted.current = false;
    setPairedLoaded(false);
    setAutoConnectLoaded(false);
    const unsubscribeDevices = subscribeWithDeadline<PairedDevice[]>(
      (onData, onError) => subscribeToPairedDevices(uid, onData, onError),
      (devices) => {
        setPairedDevices(devices.map((device) => ({ ...device, deviceId: deviceKey(device.platform ?? 'android', device.deviceId) })));
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
    if (!uid) return;
    for (const [id, current] of Object.entries(connections)) {
      const before = previousStatuses.current[id];
      previousStatuses.current[id] = current.status;
      if (before === 'connected' && current.status !== 'connected') flushReadings(id);
      if (current.status !== 'connected') continue;
      if (current.error) setScanError(current.error);
      const scanned = scannedRef.current[id];
      const previous = pairedRef.current.find((device) => device.deviceId === id);
      const metadata = {
        platform,
        localName: scanned?.name ?? previous?.localName,
        serviceUUIDs: scanned?.serviceUUIDs ?? previous?.serviceUUIDs,
        lastRssi: current.rssi ?? scanned?.rssi ?? previous?.lastRssi ?? undefined,
        lastBattery: current.batteryLevel ?? previous?.lastBattery ?? undefined,
        modelNumber: current.modelNumber ?? previous?.modelNumber ?? undefined,
        firmwareRevision: current.firmwareRevision ?? previous?.firmwareRevision ?? undefined,
      };
      // RSSI is polled every ten seconds but paired metadata need not be written that often.
      const fingerprint = JSON.stringify({ battery: metadata.lastBattery, model: metadata.modelNumber, firmware: metadata.firmwareRevision });
      if (before === 'connected' && savedMetadata.current[id] === fingerprint) continue;
      savedMetadata.current[id] = fingerprint;
      void withDeadline(savePairedDevice(uid, nativeDeviceId(id), current.deviceName ?? 'Unknown device', {
        ...metadata, updateConnectionTime: before !== 'connected',
      })).catch(() => { if (getAuth().currentUser?.uid === uid) setScanError("Couldn't save the paired device."); });
    }
  }, [uid, connections]);

  useEffect(() => bleService.onHeartRate((bpm, deviceId, deviceName) => {
    if (!uid || !ownerReady.current || getAuth().currentUser?.uid !== uid) return;
    void addSensorReading(SENSOR_UID, 'heart_rate', { value: bpm, deviceId, deviceName, source: 'ble' });
  }), [uid]);

  useEffect(() => {
    if (!uid || !preferencesLoaded || !preferences.notifications) return;
    let active = true;
    let thresholds: AlertThresholds | null = null;
    const stopThresholds = subscribeToAlertThresholds(uid, (next) => { thresholds = next; }, (error) => {
      if (active) setScanError(`Couldn't load alert thresholds: ${error.message}`);
    });
    const stopReadings = onLiveReading((reading) => {
      if (!active || !thresholds || getAuth().currentUser?.uid !== uid) return;
      const alertType = reading.value > thresholds.hrMax ? 'HR_HIGH' : reading.value < thresholds.hrMin ? 'HR_LOW' : null;
      if (!alertType) return;
      const key = alertCooldownKey(reading, alertType);
      const alert = checkHeartRate(reading, thresholds, lastAlerts.current.get(key), Date.now(), __DEV__);
      if (!alert) return;
      lastAlerts.current.set(key, alert.timestamp);
      void addAlert(uid, alert).then(async () => {
        if (active && getAuth().currentUser?.uid === uid) {
          try { await presentHeartRateAlert(alert); }
          catch (error) { if (active) setScanError(`Couldn't show heart rate notification: ${String(error)}`); }
        }
      }).catch((error) => {
        if (active) setScanError(`Couldn't save heart rate alert: ${String(error)}`);
      });
    });
    return () => { active = false; stopReadings(); stopThresholds(); };
  }, [uid, preferencesLoaded, preferences.notifications]);

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
    const request = (requests.current.get(device.id) ?? 0) + 1;
    requests.current.set(device.id, request);
    const active = () => requests.current.get(device.id) === request && getAuth().currentUser?.uid === uid;
    try {
      await reset.current;
      if (!active()) return false;
      setScanError(null);
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
      if (!active()) return false;
      const connected = await bleService.connect(device.id, device.name);
      if (!active()) return false;
      if (connected || Platform.OS !== 'ios' || paired?.platform !== 'ios' || !paired.serviceUUIDs?.length) {
        return connected;
      }
      const match = await bleService.findMatchingDevice(paired.localName ?? paired.name, paired.serviceUUIDs);
      if (!match || !active()) return false;
      scannedRef.current = { ...scannedRef.current, [match.id]: match };
      setDevicesById((previous) => ({ ...previous, [match.id]: match }));
      return bleService.connect(match.id, match.name);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : String(error));
      return false;
    }
  }, [uid, startScan, watchBluetoothState]);

  useEffect(() => {
    if (autoConnectAttempted.current || !pairedLoaded || !autoConnectLoaded || bluetoothState !== 'PoweredOn' || !autoConnect) return;
    autoConnectAttempted.current = true;
    let cancelled = false;
    const eligible = pairedDevices.filter((device) => (device.platform ?? 'android') === platform).slice(0, MAX_CONNECTED_DEVICES);
    void (async () => {
      await reset.current;
      for (const device of eligible) {
        if (cancelled) return;
        try { await connect({ id: device.deviceId, name: device.name }); }
        catch (error) { if (!cancelled) setScanError(String(error)); }
      }
    })();
    return () => { cancelled = true; };
  }, [uid, pairedLoaded, autoConnectLoaded, bluetoothState, autoConnect, connect]);

  const disconnect = useCallback(async (deviceId?: string) => {
    const id = deviceId ?? bleService.getConnectionState().deviceId;
    if (id) requests.current.set(id, (requests.current.get(id) ?? 0) + 1);
    await bleService.disconnect(deviceId);
  }, []);

  const forgetDevice = useCallback(async (deviceId: string) => {
    if (!uid) return;
    try {
      await disconnect(deviceId);
      await withDeadline(forgetPairedDevice(uid, nativeDeviceId(deviceId)));
    } catch {
      setScanError("Couldn't forget the paired device.");
    }
  }, [uid, disconnect]);

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
    () => Object.values(devicesById).sort((a, b) => Number(b.isHeartRateDevice) - Number(a.isHeartRateDevice) || b.rssi - a.rssi),
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
