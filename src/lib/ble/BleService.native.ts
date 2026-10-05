import { Platform } from "react-native";
import { deviceKey, nativeDeviceId } from "./deviceKey";
import { withDeadline } from '../asyncDeadline';

import {
  BleError,
  BleErrorCode,
  BleManager,
  Device,
  State,
  Subscription,
} from "react-native-ble-plx";

import {
  CONNECT_TIMEOUT_MS,
  GATT,
  MAX_AUTO_RECONNECT_ATTEMPTS,
  MAX_CONNECT_ATTEMPTS,
  REQUESTED_MTU,
  RETRY_BASE_DELAY_MS,
  SCAN_TIMEOUT_MS,
  MAX_CONNECTED_DEVICES,
} from "./constants";
import { canonicalGattUuid, sharesAdvertisedService } from "./uuid";
import { parseHeartRateMeasurement } from "./heartRateMeasurement";
import type { ConnectionEvent } from '../devices/connectionLog';

export type ScannedDevice = {
  id: string;
  name: string;
  rssi: number;
  // Advertises the standard Heart Rate service, so it's likely a wearable
  isHeartRateDevice: boolean;
  serviceUUIDs?: string[];
};

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "discovering"
  | "connected"
  | "reconnecting"
  | "disconnecting";

export type ConnectionState = {
  status: ConnectionStatus;
  deviceId: string | null;
  deviceName: string | null;
  // Current handshake attempt (1-based), 0 when idle or connected
  attempt: number;
  batteryLevel: number | null;
  // Last failure shown to the user, cleared on the next attempt
  error: string | null;
  rssi?: number | null;
  modelNumber?: string | null;
  firmwareRevision?: string | null;
};

type BleEvent = Omit<ConnectionEvent, 'id' | 'timestamp'>;

type ScanCallbacks = {
  onDevice: (device: ScannedDevice) => void;
  onError: (message: string) => void;
  onStop: () => void;
};

const INITIAL_CONNECTION: ConnectionState = {
  status: "disconnected",
  deviceId: null,
  deviceName: null,
  attempt: 0,
  batteryLevel: null,
  error: null,
};

// Errors where retrying cannot help until the user does something
const NON_RETRYABLE_ERRORS: number[] = [
  BleErrorCode.BluetoothManagerDestroyed,
  BleErrorCode.BluetoothUnsupported,
  BleErrorCode.BluetoothUnauthorized,
  BleErrorCode.BluetoothPoweredOff,
  BleErrorCode.InvalidIdentifiers,
];

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class StaleConnectionError extends Error {}

type SessionEntry = { connection: DeviceConnection; pending?: Promise<boolean>; cancelled: boolean };

export class BleService {
  private manager: BleManager | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private scanPassTimer: ReturnType<typeof setTimeout> | null = null;
  private scanCallbacks: ScanCallbacks | null = null;
  private scanGeneration = 0;
  private sessions = new Map<string, SessionEntry>();
  private latestId: string | null = null;
  private listeners = new Set<(states: Record<string, ConnectionState>) => void>();
  private heartRateListeners = new Set<(bpm: number, deviceId: string, name: string | null) => void>();
  private eventListeners = new Set<(event: BleEvent) => void>();

  private getManager(): BleManager {
    return this.manager ??= new BleManager();
  }

  // ----- Adapter state -----

  onBluetoothStateChange(
    listener: (state: State) => void
  ): Subscription {
    return this.getManager().onStateChange(listener, true);
  }

  // ----- Scanning -----

  async startScan(callbacks: ScanCallbacks): Promise<void> {
    const manager = this.getManager();

    await this.stopScan();

    const state = await withDeadline(manager.state());

    if (state !== State.PoweredOn) {
      throw new Error(describeBluetoothState(state));
    }

    this.scanCallbacks = callbacks;
    const generation = ++this.scanGeneration;
    let currentPass = 0;

    // A short Heart Rate pass highlights standard straps; the unfiltered
    // remainder also finds watches that omit 0x180D in advertisements.
    const scanPass = async (serviceUUIDs: string[] | null) => {
      const pass = ++currentPass;
      await withDeadline(manager.startDeviceScan(
        serviceUUIDs,
        { allowDuplicates: false },
        (error, device) => {
          if (generation !== this.scanGeneration || pass !== currentPass || !this.scanCallbacks) return;
          if (error) {
            this.finishScan();
            callbacks.onError(describeError(error));
            return;
          }
          const scanned = device ? toScannedDevice(device) : null;
          if (scanned) callbacks.onDevice(scanned);
        }
      ));
    };

    try {
      await scanPass([GATT.HEART_RATE_SERVICE]);
    } catch (e) {
      this.finishScan();
      throw new Error(describeError(e));
    }

    this.scanPassTimer = setTimeout(async () => {
      if (generation !== this.scanGeneration || !this.scanCallbacks) return;
      try {
        currentPass++;
        await withDeadline(manager.stopDeviceScan());
        if (generation === this.scanGeneration && this.scanCallbacks) await scanPass(null);
      } catch (e) {
        if (generation === this.scanGeneration && this.scanCallbacks) {
          this.finishScan();
          callbacks.onError(describeError(e));
        }
      }
    }, 6000);
    this.scanTimer = setTimeout(() => {
      this.stopScan();
    }, SCAN_TIMEOUT_MS);
  }

  async stopScan(): Promise<void> {
    if (!this.scanCallbacks) {
      return;
    }

    this.finishScan();

    try {
      await withDeadline(this.getManager().stopDeviceScan());
    } catch (e) {
      console.log("Failed to stop BLE scan:", e);
    }
  }

  private finishScan() {
    this.scanGeneration++;
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
    if (this.scanPassTimer) {
      clearTimeout(this.scanPassTimer);
      this.scanPassTimer = null;
    }

    const callbacks = this.scanCallbacks;
    this.scanCallbacks = null;
    callbacks?.onStop();
  }

  // A stale iOS peripheral UUID can be rediscovered only when both the
  // advertised name and service match; ambiguous results need user selection.
  async findMatchingDevice(name: string, serviceUUIDs: string[]): Promise<ScannedDevice | null> {
    if (!name.trim() || serviceUUIDs.length === 0) return null;
    const matches = new Map<string, ScannedDevice>();
    await this.startScan({
      onDevice: (device) => {
        const advertised = device.serviceUUIDs ?? [];
        if (
          device.name === name &&
          sharesAdvertisedService(advertised, serviceUUIDs)
        ) matches.set(device.id, device);
      },
      onError: () => undefined,
      onStop: () => undefined,
    });
    const generation = this.scanGeneration;
    await delay(SCAN_TIMEOUT_MS);
    if (this.scanGeneration === generation) await this.stopScan();
    return matches.size === 1 ? [...matches.values()][0] : null;
  }


  getConnections(): Record<string, ConnectionState> {
    return Object.fromEntries([...this.sessions].map(([id, entry]) => [id, {
      ...entry.connection.getConnectionState(), deviceId: id,
    }]));
  }

  getConnectionState(): ConnectionState {
    return (this.latestId && this.getConnections()[this.latestId]) || INITIAL_CONNECTION;
  }

  subscribe(listener: (states: Record<string, ConnectionState>) => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  onHeartRate(listener: (bpm: number, deviceId: string, name: string | null) => void) {
    this.heartRateListeners.add(listener);
    return () => { this.heartRateListeners.delete(listener); };
  }

  onConnectionEvent(listener: (event: BleEvent) => void) {
    this.eventListeners.add(listener);
    return () => { this.eventListeners.delete(listener); };
  }

  async pollRssi() {
    await Promise.all([...this.sessions.values()].map((entry) => entry.connection.pollRssi()));
  }

  connect(id: string, name: string | null): Promise<boolean> {
    const key = deviceKey(Platform.OS === 'ios' ? 'ios' : 'android', id);
    const existing = this.sessions.get(key);
    if (existing?.pending) return existing.pending;
    if (existing?.connection.getConnectionState().status === 'connected') {
      this.latestId = key;
      this.emit();
      return Promise.resolve(true);
    }
    if (existing?.connection.getConnectionState().status === 'disconnecting') return Promise.resolve(false);
    const active = [...this.sessions.values()].filter((entry) => entry.pending || entry.connection.getConnectionState().status !== 'disconnected');
    if (active.length >= MAX_CONNECTED_DEVICES) return Promise.reject(new Error('A maximum of 4 devices can be connected. Disconnect one first.'));
    const entry: SessionEntry = { connection: new DeviceConnection(() => this.getManager(), (event) => {
      if (this.sessions.get(key) !== entry || (entry.cancelled && !(event.type === 'disconnected' && event.reason === 'user'))) return;
      const tagged = { ...event, deviceId: event.deviceId ? key : null };
      this.eventListeners.forEach((listener) => listener(tagged));
    }), cancelled: false };
    this.sessions.set(key, entry);
    this.latestId = key;
    entry.connection.subscribe(() => { if (this.sessions.get(key) === entry) this.emit(); });
    entry.connection.onHeartRate((bpm) => {
      if (this.sessions.get(key) !== entry || entry.cancelled) return;
      this.heartRateListeners.forEach((listener) => listener(bpm, key, name));
    });
    entry.pending = (async () => {
      await this.stopScan();
      if (entry.cancelled) return false;
      return entry.connection.connect(nativeDeviceId(key), name);
    })().finally(() => { entry.pending = undefined; });
    return entry.pending;
  }

  async disconnect(deviceId?: string): Promise<void> {
    const key = deviceId ? deviceKey(Platform.OS === 'ios' ? 'ios' : 'android', deviceId) : this.latestId;
    const entry = key ? this.sessions.get(key) : undefined;
    if (!entry) return;
    entry.cancelled = true;
    await entry.connection.disconnect();
  }

  async disconnectAll(): Promise<void> {
    await Promise.all([...this.sessions.keys()].map((key) => this.disconnect(key)));
    this.sessions.clear();
    this.latestId = null;
    this.emit();
  }

  private emit() { const states = this.getConnections(); this.listeners.forEach((listener) => listener(states)); }
}

let nextSessionId = 0;

class DeviceConnection {
  private sessionId = ++nextSessionId;
  private disconnectSubscription: Subscription | null = null;
  private heartRateSubscription: Subscription | null = null;
  private heartRateListeners = new Set<(bpm: number) => void>();
  private connection: ConnectionState = INITIAL_CONNECTION;
  private listeners = new Set<(state: ConnectionState) => void>();
  private connectionToken = 0;
  constructor(private getManager: () => BleManager, private onEvent: (event: BleEvent) => void) {}

  // ----- Connection state -----

  getConnectionState(): ConnectionState {
    return this.connection;
  }

  subscribe(
    listener: (state: ConnectionState) => void
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  // Called with each heart rate value (bpm) from a connected device that
  // has the standard Heart Rate service. Returns an unsubscribe function.
  onHeartRate(listener: (bpm: number) => void): () => void {
    this.heartRateListeners.add(listener);

    return () => {
      this.heartRateListeners.delete(listener);
    };
  }

  private setConnection(update: Partial<ConnectionState>) {
    this.connection = { ...this.connection, ...update };
    this.listeners.forEach((listener) => listener(this.connection));
  }

  async pollRssi() {
    const deviceId = this.connection.deviceId;
    if (!deviceId || this.connection.status !== 'connected') return;
    const token = this.connectionToken;
    try {
      const device = await withDeadline(this.getManager().readRSSIForDevice(deviceId), 3000);
      if (!this.isStale(token) && this.connection.status === 'connected' && typeof device.rssi === 'number') this.setConnection({ rssi: device.rssi });
    } catch { /* RSSI is optional. */ }
  }

  // ----- Connection handshake -----

  // Connects to a device and runs the full handshake. Resolves true once
  // the device is ready to use, or false if it failed or was cancelled.
  // The reason for a failure is in getConnectionState().error.
  async connect(
    deviceId: string,
    deviceName: string | null
  ): Promise<boolean> {
    if (
      this.connection.deviceId === deviceId &&
      this.connection.status === "connected"
    ) {
      return true;
    }

    const previousDeviceId = this.connection.deviceId;
    const token = ++this.connectionToken;

    this.clearDisconnectSubscription();
    this.stopHeartRateMonitor();

    if (previousDeviceId && previousDeviceId !== deviceId) {
      await this.cancelConnection(previousDeviceId);
    }

    return this.connectWithRetry(
      deviceId,
      deviceName,
      token,
      MAX_CONNECT_ATTEMPTS,
      "connecting"
    );
  }

  // Disconnects, or cancels a connection or reconnect in progress
  async disconnect(): Promise<void> {
    const deviceId = this.connection.deviceId;

    this.connectionToken++;
    this.clearDisconnectSubscription();
    this.stopHeartRateMonitor();

    if (!deviceId) {
      return;
    }

    const token = this.connectionToken;
    if (this.connection.status === 'connected') this.onEvent({ type: 'disconnected', deviceId, reason: 'user' });
    this.setConnection({ status: "disconnecting" });
    await this.cancelConnection(deviceId);
    if (!this.isStale(token)) this.setConnection({ ...INITIAL_CONNECTION, deviceId });
  }

  private async connectWithRetry(
    deviceId: string,
    deviceName: string | null,
    token: number,
    maxAttempts: number,
    status: "connecting" | "reconnecting"
  ): Promise<boolean> {
    let lastError: unknown = null;
    const started = Date.now();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (this.isStale(token)) {
        return false;
      }

      this.setConnection({
        status,
        deviceId,
        deviceName,
        attempt,
        batteryLevel: null,
        error: null,
      });
      this.onEvent({ type: 'connect_attempt', deviceId, attempt, auto: status === 'reconnecting' });

      try {
        await this.handshake(deviceId, token);
        this.onEvent({ type: 'connected', deviceId, connectMs: Date.now() - started });
        return true;
      } catch (e) {
        lastError = e;
        if (this.isStale(token)) return false;
        this.stopHeartRateMonitor();
        console.log(
          `BLE handshake attempt ${attempt}/${maxAttempts} failed:`,
          e
        );

        // A failed attempt can leave a half-open GATT link behind. On
        // Android that makes the next attempt fail with status 133.
        await this.cancelConnection(deviceId);

        if (this.isStale(token) || !isRetryable(e)) {
          break;
        }

        if (attempt < maxAttempts) {
          await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
        }
      }
    }

    if (this.isStale(token)) {
      return false;
    }

    this.setConnection({
      ...INITIAL_CONNECTION,
      error: describeError(lastError),
    });
    this.onEvent({ type: 'failed', deviceId });

    return false;
  }

  // One attempt: connect, discover services, read initial data, then
  // start watching for drops. Throws if any step fails.
  private async handshake(deviceId: string, token: number) {
    const manager = this.getManager();

    await withDeadline(manager.connectToDevice(deviceId, {
      timeout: CONNECT_TIMEOUT_MS,
      requestMTU:
        Platform.OS === "android" ? REQUESTED_MTU : undefined,
    }), CONNECT_TIMEOUT_MS + 1000);
    this.throwIfStale(token);

    this.setConnection({ status: "discovering" });

    // Characteristics can only be read or monitored after discovery
    await withDeadline(manager.discoverAllServicesAndCharacteristicsForDevice(deviceId));
    this.throwIfStale(token);

    // Device Information is optional and is not required by this handshake.
    const hasHeartRate = await this.startHeartRateMonitor(deviceId, token);
    this.throwIfStale(token);

    this.watchForDisconnect(deviceId, token);

    this.setConnection({
      status: "connected",
      attempt: 0,
      batteryLevel: null,
      error: hasHeartRate ? null : "This device doesn't provide heart rate.",
    });
    void this.readBatteryLevel(deviceId).then((batteryLevel) => {
      if (!this.isStale(token) && this.connection.status === 'connected') this.setConnection({ batteryLevel });
    });
    void this.readDeviceInformation(deviceId).then((info) => {
      if (!this.isStale(token) && this.connection.status === 'connected') this.setConnection(info);
    });
  }

  private watchForDisconnect(deviceId: string, token: number) {
    this.clearDisconnectSubscription();

    this.disconnectSubscription =
      this.getManager().onDeviceDisconnected(deviceId, (error) => {
        if (this.isStale(token)) return;
        this.clearDisconnectSubscription();
        this.stopHeartRateMonitor();
        this.onEvent({ type: 'disconnected', deviceId, reason: 'unexpected' });

        console.log("BLE device disconnected unexpectedly:", error);

        // The watch went out of range or rebooted, so try to get it back.
        // Keeps the same token so the user can still cancel with disconnect().
        this.connectWithRetry(
          deviceId,
          this.connection.deviceName,
          token,
          MAX_AUTO_RECONNECT_ATTEMPTS,
          "reconnecting"
        );
      });
  }

  // Subscribes to Heart Rate Measurement notifications if the device has
  // the standard Heart Rate service. Devices without it are left alone.
  private async startHeartRateMonitor(deviceId: string, token: number) {
    this.stopHeartRateMonitor();

    const services = await withDeadline(this.getManager().servicesForDevice(deviceId));
    this.throwIfStale(token);
    const hasHeartRate = services.some(
      (service) => canonicalGattUuid(service.uuid) === GATT.HEART_RATE_SERVICE
    );

    if (!hasHeartRate) {
      return false;
    }

    this.heartRateSubscription =
      this.getManager().monitorCharacteristicForDevice(
        deviceId,
        GATT.HEART_RATE_SERVICE,
        GATT.HEART_RATE_MEASUREMENT,
        (error, characteristic) => {
          // Errors here mean the link dropped or monitoring was stopped,
          // which the disconnect handling already deals with
          if (this.isStale(token) || error || !characteristic?.value) {
            return;
          }

          const bpm = parseHeartRateMeasurement(characteristic.value);

          if (bpm !== null) {
            this.heartRateListeners.forEach((listener) => listener(bpm));
          }
        }
      );
    return true;
  }

  private stopHeartRateMonitor() {
    this.heartRateSubscription?.remove();
    this.heartRateSubscription = null;
  }

  // Standard Battery Level characteristic. Returns null if the device
  // doesn't expose it, since plenty of devices don't.
  private async readBatteryLevel(
    deviceId: string
  ): Promise<number | null> {
    const transaction = `battery-${deviceId}-${this.sessionId}-${this.connectionToken}`;
    try {
      const characteristic =
        await withDeadline(this.getManager().readCharacteristicForDevice(
          deviceId,
          GATT.BATTERY_SERVICE,
          GATT.BATTERY_LEVEL,
          transaction,
        ), 2000, () => { void this.getManager().cancelTransaction(transaction).catch(() => undefined); });

      if (!characteristic.value) {
        return null;
      }

      // One byte, 0-100, base64 encoded by ble-plx
      const bytes = atob(characteristic.value);
      const level = bytes.charCodeAt(0);
      return bytes.length === 1 && level <= 100 ? level : null;
    } catch {
      return null;
    }
  }

  private async readDeviceInformation(deviceId: string) {
    const read = async (uuid: string) => {
      try {
        const characteristic = await withDeadline(this.getManager().readCharacteristicForDevice(deviceId, GATT.DEVICE_INFORMATION_SERVICE, uuid), 2000);
        const value = characteristic.value ? atob(characteristic.value).trim().slice(0, 60) : '';
        return value || null;
      } catch { return null; }
    };
    const [modelNumber, firmwareRevision] = await Promise.all([read(GATT.MODEL_NUMBER), read(GATT.FIRMWARE_REVISION)]);
    return { modelNumber, firmwareRevision };
  }

  private async cancelConnection(deviceId: string) {
    try {
      await withDeadline(this.getManager().cancelDeviceConnection(deviceId));
    } catch {
      // Already disconnected
    }
  }

  private clearDisconnectSubscription() {
    this.disconnectSubscription?.remove();
    this.disconnectSubscription = null;
  }

  private isStale(token: number) {
    return token !== this.connectionToken;
  }

  private throwIfStale(token: number) {
    if (this.isStale(token)) {
      throw new StaleConnectionError("Connection cancelled");
    }
  }
}

function toScannedDevice(device: Device): ScannedDevice | null {
  const name = device.name ?? device.localName;

  // Skip anonymous beacons and trackers so the list stays readable
  if (!name || device.rssi === null) {
    return null;
  }

  return {
    id: deviceKey(Platform.OS === "ios" ? "ios" : "android", device.id),
    name,
    rssi: device.rssi,
    isHeartRateDevice:
      device.serviceUUIDs?.some(
        (uuid) => canonicalGattUuid(uuid) === GATT.HEART_RATE_SERVICE
      ) ?? false,
    serviceUUIDs: device.serviceUUIDs ?? undefined,
  };
}

function isRetryable(error: unknown): boolean {
  if (error instanceof StaleConnectionError) {
    return false;
  }

  if (error instanceof BleError) {
    return !NON_RETRYABLE_ERRORS.includes(error.errorCode);
  }

  return true;
}

export function describeBluetoothState(state: State): string {
  switch (state) {
    case State.PoweredOff:
      return "Bluetooth is turned off. Turn it on to find your device.";
    case State.Unauthorized:
      return "Bluetooth permission was denied. Allow it in your phone's settings.";
    case State.Unsupported:
      return "This device doesn't support Bluetooth Low Energy.";
    case State.Resetting:
      return "Bluetooth is restarting. Try again in a moment.";
    default:
      return "Bluetooth isn't ready yet. Try again in a moment.";
  }
}

function describeError(error: unknown): string {
  if (error instanceof BleError) {
    switch (error.errorCode) {
      case BleErrorCode.BluetoothPoweredOff:
        return "Bluetooth is turned off.";
      case BleErrorCode.BluetoothUnauthorized:
        return "Bluetooth permission was denied.";
      case BleErrorCode.BluetoothUnsupported:
        return "This device doesn't support Bluetooth Low Energy.";
      case BleErrorCode.OperationTimedOut:
      case BleErrorCode.OperationCancelled:
      case BleErrorCode.DeviceConnectionFailed:
        return "Couldn't reach the device. Make sure it's nearby and awake.";
      case BleErrorCode.DeviceDisconnected:
        return "The device disconnected during setup.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong with Bluetooth.";
}

// One shared instance: there must only be a single BleManager per app
export const bleService = new BleService();
