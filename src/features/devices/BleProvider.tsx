import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { buildDeviceHistory } from '@/data/deviceHistory';
import { disconnectedConnection, mockScannedDevices } from '@/data/mocks';
import type { BluetoothState, ConnectionState, PairedDevice, ScannedDevice } from '@/data/types';
import { logConnectionEvent, seedConnectionLog } from '@/lib/devices/connectionLog';
import { addSensorReading, seedReadings } from '@/lib/sensors/readings';
import { SENSOR_UID } from '@/lib/sensors/useSensorReadings';

// Same shape as Android's useBle() (services/ble/BleContext.tsx), extended for several devices at once
// (Phase 2 Step B item 10): `connections` holds one state per device, `connection` is the most recent one.
// Phase 2: replace this mock with the ported, multi-device BleProvider; screens stay as they are.
export type BleContextValue = {
  bluetoothState: BluetoothState;
  isScanning: boolean;
  devices: ScannedDevice[];
  scanError: string | null;
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  connection: ConnectionState;
  connections: Record<string, ConnectionState>;
  connect: (device: { id: string; name: string | null }) => Promise<boolean>;
  // No id: the most recent device (Android's single-device behaviour).
  disconnect: (deviceId?: string) => Promise<void>;
  pairedDevices: PairedDevice[];
  forgetDevice: (deviceId: string) => Promise<void>;
  autoConnect: boolean;
  setAutoConnect: (enabled: boolean) => Promise<void>;
  // Mock/dev only, for testing the reliability stats and health badges.
  simulateDropOut: (deviceId: string) => void;
  setReadingsPaused: (deviceId: string, paused: boolean) => void;
  pausedDevices: string[];
  supportsTestControls?: boolean;
  ensureBluetoothReady?: () => void;
  // Real backend only: scans until a device with this name is found (NFC pairing on iOS,
  // which can't connect by Bluetooth address). Resolves null if none is found.
  findDeviceByName?: (name: string) => Promise<ScannedDevice | null>;
};

// Android constants (services/ble/constants.ts)
const SCAN_TIMEOUT_MS = 15000;
const MAX_CONNECT_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

const ATTEMPT_MS = 1200;
const DISCOVER_MS = 800;
const DISCONNECT_MS = 500;
const UNREACHABLE = "Couldn't reach the device. Make sure it's nearby and awake.";

// Mock streaming while connected (a real watch notifies HR about once a second).
const HR_EVERY_MS = 5000;
const STEPS_EVERY_MS = 30000;

// Mock only: this device always fails, so the FAILED state can be tested.
const failsToConnect = (name: string | null) => (name ?? '').toLowerCase().includes('polar');
const mockBattery = (id: string) => (id.startsWith('E1') ? null : 70 + (id.charCodeAt(0) % 25));
const mockRssi = (id: string) => mockScannedDevices.find((d) => d.id === id)?.rssi ?? -70;

// Seed once per app run: previously connected devices with recorded history.
const history = buildDeviceHistory();
let seeded = false;

const BleContext = createContext<BleContextValue | null>(null);

export function BleProvider({ children }: { children: React.ReactNode }) {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<ScannedDevice[]>([]);
  const [connections, setConnections] = useState<Record<string, ConnectionState>>({});
  const [latestId, setLatestId] = useState<string | null>(null);
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>(history.paired);
  const [autoConnect, setAutoConnectState] = useState(true);
  const [pausedDevices, setPausedDevices] = useState<string[]>([]);

  const tokens = useRef(new Map<string, number>());
  const scanTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const streams = useRef(new Map<string, ReturnType<typeof setInterval>[]>());
  const stepTotals = useRef(new Map<string, number>());
  const paused = useRef(new Set<string>());

  useEffect(() => {
    if (!seeded) {
      seeded = true;
      seedConnectionLog(history.events);
      seedReadings(history.readings);
    }
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') logConnectionEvent({ type: 'app_background', deviceId: null });
      if (state === 'active') logConnectionEvent({ type: 'app_foreground', deviceId: null });
    });
    const allTimers = timers.current;
    const allStreams = streams.current;
    return () => {
      sub.remove();
      scanTimers.current.forEach(clearTimeout);
      allTimers.forEach(clearTimeout);
      allStreams.forEach((list) => list.forEach(clearInterval));
    };
  }, []);

  const wait = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          timers.current.delete(timer);
          resolve();
        }, ms);
        timers.current.add(timer);
      }),
    [],
  );

  const setState = useCallback((deviceId: string, next: ConnectionState) => {
    setConnections((prev) => ({ ...prev, [deviceId]: next }));
    setLatestId(deviceId);
  }, []);

  const stopStream = useCallback((deviceId: string) => {
    streams.current.get(deviceId)?.forEach(clearInterval);
    streams.current.delete(deviceId);
  }, []);

  // Mock live data, tagged with the device (Phase 2: real HR notifications, saved once a minute).
  const startStream = useCallback(
    (deviceId: string, name: string) => {
      stopStream(deviceId);
      let i = 0;
      const base = 66 + (deviceId.charCodeAt(1) % 14);
      const hr = setInterval(() => {
        if (paused.current.has(deviceId)) return;
        i += 1;
        addSensorReading(SENSOR_UID, 'heart_rate', {
          value: base + Math.round(Math.sin(i / 3) * 6 + Math.random() * 4),
          deviceId,
          deviceName: name,
          source: 'ble',
        });
      }, HR_EVERY_MS);
      const steps = setInterval(() => {
        if (paused.current.has(deviceId)) return;
        const total = (stepTotals.current.get(deviceId) ?? 0) + 15 + Math.floor(Math.random() * 60);
        stepTotals.current.set(deviceId, total);
        addSensorReading(SENSOR_UID, 'steps', { value: total, deviceId, deviceName: name, source: 'ble' });
      }, STEPS_EVERY_MS);
      streams.current.set(deviceId, [hr, steps]);
    },
    [stopStream],
  );

  const stopScan = useCallback(async () => {
    scanTimers.current.forEach(clearTimeout);
    scanTimers.current = [];
    setIsScanning(false);
  }, []);

  const startScan = useCallback(async () => {
    await stopScan();
    setDevices([]);
    setIsScanning(true);
    mockScannedDevices.forEach((device, index) => {
      scanTimers.current.push(
        setTimeout(() => {
          setDevices((prev) => [...prev, device].sort((a, b) => b.rssi - a.rssi));
        }, 600 + index * 700),
      );
    });
    scanTimers.current.push(setTimeout(() => setIsScanning(false), SCAN_TIMEOUT_MS));
  }, [stopScan]);

  const remember = useCallback((deviceId: string, name: string, rssi: number, battery: number | null) => {
    setPairedDevices((prev) => {
      const now = new Date();
      const existing = prev.find((d) => d.deviceId === deviceId);
      const updated: PairedDevice = existing
        ? { ...existing, name, lastConnectedAt: now, lastRssi: rssi, lastBattery: battery }
        : { deviceId, name, addedAt: now, lastConnectedAt: now, lastRssi: rssi, lastBattery: battery };
      return [updated, ...prev.filter((d) => d.deviceId !== deviceId)];
    });
  }, []);

  // Android's handshake per device: 3 attempts, 1 s / 2 s backoff, cancellable by a newer token.
  const runHandshake = useCallback(
    async (device: { id: string; name: string | null }, status: 'connecting' | 'reconnecting') => {
      const mine = (tokens.current.get(device.id) ?? 0) + 1;
      tokens.current.set(device.id, mine);
      const stale = () => tokens.current.get(device.id) !== mine;
      const name = device.name ?? 'Unknown device';
      const rssi = mockRssi(device.id);
      const base = { deviceId: device.id, deviceName: name, batteryLevel: null, error: null, rssi };
      const started = Date.now();

      for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
        if (stale()) return false;
        logConnectionEvent({ type: 'connect_attempt', deviceId: device.id, attempt, auto: status === 'reconnecting' });
        setState(device.id, { ...base, status, attempt });
        await wait(ATTEMPT_MS);
        if (stale()) return false;

        if (!failsToConnect(device.name)) {
          setState(device.id, { ...base, status: 'discovering', attempt: 0 });
          await wait(DISCOVER_MS);
          if (stale()) return false;
          const battery = mockBattery(device.id);
          setState(device.id, { ...base, status: 'connected', attempt: 0, batteryLevel: battery });
          logConnectionEvent({ type: 'connected', deviceId: device.id, connectMs: Date.now() - started });
          remember(device.id, name, rssi, battery);
          startStream(device.id, name);
          return true;
        }
        if (attempt < MAX_CONNECT_ATTEMPTS) await wait(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }

      if (stale()) return false;
      logConnectionEvent({ type: 'failed', deviceId: device.id });
      setState(device.id, { ...disconnectedConnection, deviceId: device.id, deviceName: name, error: UNREACHABLE });
      return false;
    },
    [remember, setState, startStream, wait],
  );

  const connect = useCallback(
    async (device: { id: string; name: string | null }) => {
      await stopScan();
      return runHandshake(device, 'connecting');
    },
    [runHandshake, stopScan],
  );

  const disconnect = useCallback(
    async (deviceId?: string) => {
      const id = deviceId ?? latestId;
      if (!id) return;
      tokens.current.set(id, (tokens.current.get(id) ?? 0) + 1);
      const mine = tokens.current.get(id);
      const current = connections[id];
      stopStream(id);
      if (current?.status === 'connected') logConnectionEvent({ type: 'disconnected', deviceId: id, reason: 'user' });
      setConnections((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], status: 'disconnecting', attempt: 0 } } : prev));
      await wait(DISCONNECT_MS);
      if (tokens.current.get(id) === mine) {
        setConnections((prev) => ({ ...prev, [id]: { ...disconnectedConnection } }));
      }
    },
    [connections, latestId, stopStream, wait],
  );

  // Mock/dev: the link drops (out of range) → logged as unexpected, then Android's auto-reconnect.
  const simulateDropOut = useCallback(
    (deviceId: string) => {
      const current = connections[deviceId];
      if (current?.status !== 'connected') return;
      stopStream(deviceId);
      logConnectionEvent({ type: 'disconnected', deviceId, reason: 'unexpected' });
      runHandshake({ id: deviceId, name: current.deviceName }, 'reconnecting');
    },
    [connections, runHandshake, stopStream],
  );

  const setReadingsPaused = useCallback((deviceId: string, pause: boolean) => {
    if (pause) paused.current.add(deviceId);
    else paused.current.delete(deviceId);
    setPausedDevices([...paused.current]);
  }, []);

  const forgetDevice = useCallback(
    async (deviceId: string) => {
      const status = connections[deviceId]?.status;
      if (status && status !== 'disconnected') await disconnect(deviceId);
      setPairedDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
    },
    [connections, disconnect],
  );

  const setAutoConnect = useCallback(async (enabled: boolean) => {
    setAutoConnectState(enabled);
  }, []);

  const connection = (latestId && connections[latestId]) || disconnectedConnection;

  const value = useMemo<BleContextValue>(
    () => ({
      bluetoothState: 'PoweredOn',
      isScanning,
      devices,
      scanError: null,
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
      simulateDropOut,
      setReadingsPaused,
      pausedDevices,
      supportsTestControls: true,
    }),
    [
      isScanning,
      devices,
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
      simulateDropOut,
      setReadingsPaused,
      pausedDevices,
    ],
  );

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
}

export function useBle(): BleContextValue {
  const context = useContext(BleContext);
  if (!context) throw new Error('useBle must be used inside BleProvider');
  return context;
}
