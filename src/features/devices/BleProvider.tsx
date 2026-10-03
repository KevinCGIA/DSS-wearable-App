import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { disconnectedConnection, mockPairedDevices, mockScannedDevices } from '@/data/mocks';
import type { BluetoothState, ConnectionState, PairedDevice, ScannedDevice } from '@/data/types';

// Same shape as Android's useBle() (services/ble/BleContext.tsx on feature/ble-connection).
// Phase 2: replace this mock with the ported BleProvider; screens and containers stay as they are.
export type BleContextValue = {
  bluetoothState: BluetoothState;
  isScanning: boolean;
  devices: ScannedDevice[];
  scanError: string | null;
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  connection: ConnectionState;
  connect: (device: { id: string; name: string | null }) => Promise<boolean>;
  disconnect: () => Promise<void>;
  pairedDevices: PairedDevice[];
  forgetDevice: (deviceId: string) => Promise<void>;
  autoConnect: boolean;
  setAutoConnect: (enabled: boolean) => Promise<void>;
};

// Android constants (services/ble/constants.ts)
const SCAN_TIMEOUT_MS = 15000;
const MAX_CONNECT_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

const ATTEMPT_MS = 1200;
const DISCOVER_MS = 800;
const DISCONNECT_MS = 500;
const MOCK_BATTERY = 85;
const UNREACHABLE = "Couldn't reach the device. Make sure it's nearby and awake.";

// Mock only: this device always fails, so the FAILED state can be tested.
const failsToConnect = (name: string | null) => (name ?? '').toLowerCase().includes('polar');

const BleContext = createContext<BleContextValue | null>(null);

export function BleProvider({ children }: { children: React.ReactNode }) {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<ScannedDevice[]>([]);
  const [connection, setConnection] = useState<ConnectionState>(disconnectedConnection);
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>(mockPairedDevices);
  const [autoConnect, setAutoConnectState] = useState(true);

  const token = useRef(0);
  const scanTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

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

  useEffect(
    () => () => {
      scanTimers.current.forEach(clearTimeout);
      timers.current.forEach(clearTimeout);
    },
    [],
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

  const remember = useCallback((deviceId: string, name: string) => {
    setPairedDevices((prev) => {
      const now = new Date();
      const existing = prev.find((d) => d.deviceId === deviceId);
      const updated: PairedDevice = existing
        ? { ...existing, name, lastConnectedAt: now }
        : { deviceId, name, addedAt: now, lastConnectedAt: now };
      return [updated, ...prev.filter((d) => d.deviceId !== deviceId)];
    });
  }, []);

  const connect = useCallback(
    async (device: { id: string; name: string | null }) => {
      const mine = ++token.current;
      await stopScan();
      const stale = () => mine !== token.current;
      const base = { deviceId: device.id, deviceName: device.name, batteryLevel: null, error: null };

      for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
        if (stale()) return false;
        setConnection({ ...base, status: 'connecting', attempt });
        await wait(ATTEMPT_MS);
        if (stale()) return false;

        if (!failsToConnect(device.name)) {
          setConnection({ ...base, status: 'discovering', attempt: 0 });
          await wait(DISCOVER_MS);
          if (stale()) return false;
          setConnection({ ...base, status: 'connected', attempt: 0, batteryLevel: MOCK_BATTERY });
          remember(device.id, device.name ?? 'Unknown device');
          return true;
        }

        if (attempt < MAX_CONNECT_ATTEMPTS) await wait(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }

      if (!stale()) setConnection({ ...disconnectedConnection, error: UNREACHABLE });
      return false;
    },
    [remember, stopScan, wait],
  );

  const disconnect = useCallback(async () => {
    const mine = ++token.current;
    setConnection((prev) => (prev.deviceId ? { ...prev, status: 'disconnecting', attempt: 0 } : prev));
    await wait(DISCONNECT_MS);
    if (mine === token.current) setConnection(disconnectedConnection);
  }, [wait]);

  const forgetDevice = useCallback(
    async (deviceId: string) => {
      if (connection.deviceId === deviceId) await disconnect();
      setPairedDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
    },
    [connection.deviceId, disconnect],
  );

  const setAutoConnect = useCallback(async (enabled: boolean) => {
    setAutoConnectState(enabled);
  }, []);

  const value = useMemo<BleContextValue>(
    () => ({
      bluetoothState: 'PoweredOn',
      isScanning,
      devices,
      scanError: null,
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
    [isScanning, devices, startScan, stopScan, connection, connect, disconnect, pairedDevices, forgetDevice, autoConnect, setAutoConnect],
  );

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
}

export function useBle(): BleContextValue {
  const context = useContext(BleContext);
  if (!context) throw new Error('useBle must be used inside BleProvider');
  return context;
}
