import { Platform } from "react-native";

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
  MAX_CONNECTED_DEVICES,
  REQUESTED_MTU,
  RETRY_BASE_DELAY_MS,
  SCAN_TIMEOUT_MS,
} from "./constants";
import { canonicalGattUuid, sharesAdvertisedService } from "./uuid";
import { parseHeartRateMeasurement } from "./heartRateMeasurement";

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
  deviceId: string;
  deviceName: string | null;
  status: ConnectionStatus;
  // Current handshake attempt (1-based), 0 when idle or connected
  attempt: number;
  batteryLevel: number | null;
  // Last failure shown to the user, cleared on the next attempt
  error: string | null;
};

type ScanCallbacks = {
  onDevice: (device: ScannedDevice) => void;
  onError: (message: string) => void;
  onStop: () => void;
};

// One connected (or connecting) device
type DeviceSession = {
  // Bumped when the user disconnects or reconnects this device. Any
  // in-flight handshake or reconnect loop holding an older token stops at
  // its next checkpoint, which makes cancelling safe.
  token: number;
  state: ConnectionState;
  disconnectSubscription: Subscription | null;
  heartRateSubscription: Subscription | null;
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

class BleService {
  private manager: BleManager | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private scanPassTimer: ReturnType<typeof setTimeout> | null = null;
  private scanCallbacks: ScanCallbacks | null = null;
  private scanGeneration = 0;
  private sessions = new Map<string, DeviceSession>();
  private nextToken = 0;
  private listeners = new Set<(connections: ConnectionState[]) => void>();
  private heartRateListeners = new Set<
    (bpm: number, deviceId: string) => void
  >();

  // Created lazily. Constructing BleManager starts the native client,
  // and on iOS that is what shows the Bluetooth permission prompt.
  private getManager(): BleManager {
    if (!this.manager) {
      this.manager = new BleManager();
    }

    return this.manager;
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

    const state = await manager.state();

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
      await manager.startDeviceScan(
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
      );
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
        await manager.stopDeviceScan();
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
      await this.getManager().stopDeviceScan();
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

  // Scans until a device matching `matches` is found, then stops. Resolves
  // null if none is found before the scan times out. Used for NFC pairing
  // on iOS, which can't connect by Bluetooth address and so has to find
  // the device by name.
  async findDevice(
    matches: (device: ScannedDevice) => boolean
  ): Promise<ScannedDevice | null> {
    return new Promise((resolve, reject) => {
      let found: ScannedDevice | null = null;

      this.startScan({
        onDevice: (device) => {
          if (!found && matches(device)) {
            found = device;
            this.stopScan();
          }
        },
        onError: (message) => reject(new Error(message)),
        onStop: () => resolve(found),
      }).catch(reject);
    });
  }

  // ----- Connection state -----

  // Every device that is connected, connecting, or whose last attempt
  // failed (status "disconnected" with an error), oldest first
  getConnections(): ConnectionState[] {
    return Array.from(this.sessions.values(), (session) => session.state);
  }

  getConnection(deviceId: string): ConnectionState | null {
    return this.sessions.get(deviceId)?.state ?? null;
  }

  subscribe(
    listener: (connections: ConnectionState[]) => void
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  // Called with each heart rate value (bpm) from any connected device
  // that has the standard Heart Rate service. Returns an unsubscribe
  // function.
  onHeartRate(
    listener: (bpm: number, deviceId: string) => void
  ): () => void {
    this.heartRateListeners.add(listener);

    return () => {
      this.heartRateListeners.delete(listener);
    };
  }

  private emit() {
    const connections = this.getConnections();
    this.listeners.forEach((listener) => listener(connections));
  }

  private updateState(
    deviceId: string,
    token: number,
    update: Partial<ConnectionState>
  ) {
    const session = this.sessions.get(deviceId);

    if (!session || session.token !== token) {
      return;
    }

    session.state = { ...session.state, ...update };
    this.emit();
  }

  // ----- Connection handshake -----

  // Connects to a device and runs the full handshake. Other connected
  // devices are left alone. Resolves true once the device is ready to use,
  // or false if it failed or was cancelled; the reason for a failure is in
  // getConnection(deviceId).error.
  async connect(
    deviceId: string,
    deviceName: string | null
  ): Promise<boolean> {
    const existing = this.sessions.get(deviceId);

    if (existing && existing.state.status === "connected") {
      return true;
    }

    // Already connecting; don't start a second handshake
    if (existing && existing.state.status !== "disconnected") {
      return false;
    }

    const active = this.getConnections().filter(
      (c) => c.status !== "disconnected"
    );

    if (active.length >= MAX_CONNECTED_DEVICES) {
      this.setFailedSession(
        deviceId,
        deviceName,
        `You can connect up to ${MAX_CONNECTED_DEVICES} devices at once. Disconnect one first.`
      );
      return false;
    }

    // Android connects much less reliably while a scan is running
    await this.stopScan();

    const token = this.startSession(deviceId, deviceName);

    return this.connectWithRetry(
      deviceId,
      token,
      MAX_CONNECT_ATTEMPTS,
      "connecting"
    );
  }

  // Disconnects one device, or cancels its connection in progress
  async disconnect(deviceId: string): Promise<void> {
    const session = this.sessions.get(deviceId);

    if (!session) {
      return;
    }

    // Invalidate any handshake or reconnect loop for this device
    session.token = ++this.nextToken;
    this.clearSubscriptions(session);

    const wasActive = session.state.status !== "disconnected";

    if (wasActive) {
      session.state = { ...session.state, status: "disconnecting" };
      this.emit();
      await this.cancelConnection(deviceId);
    }

    this.sessions.delete(deviceId);
    this.emit();
  }

  async disconnectAll(): Promise<void> {
    await Promise.all(
      Array.from(this.sessions.keys(), (id) => this.disconnect(id))
    );
  }

  // Removes a failed attempt's error from the list
  dismissError(deviceId: string) {
    const session = this.sessions.get(deviceId);

    if (session && session.state.status === "disconnected") {
      this.sessions.delete(deviceId);
      this.emit();
    }
  }

  private startSession(deviceId: string, deviceName: string | null) {
    const token = ++this.nextToken;

    this.sessions.set(deviceId, {
      token,
      state: {
        deviceId,
        deviceName,
        status: "connecting",
        attempt: 0,
        batteryLevel: null,
        error: null,
      },
      disconnectSubscription: null,
      heartRateSubscription: null,
    });
    this.emit();

    return token;
  }

  private setFailedSession(
    deviceId: string,
    deviceName: string | null,
    error: string
  ) {
    this.sessions.set(deviceId, {
      token: ++this.nextToken,
      state: {
        deviceId,
        deviceName,
        status: "disconnected",
        attempt: 0,
        batteryLevel: null,
        error,
      },
      disconnectSubscription: null,
      heartRateSubscription: null,
    });
    this.emit();
  }

  private async connectWithRetry(
    deviceId: string,
    token: number,
    maxAttempts: number,
    status: "connecting" | "reconnecting"
  ): Promise<boolean> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (this.isStale(deviceId, token)) {
        return false;
      }

      this.updateState(deviceId, token, {
        status,
        attempt,
        batteryLevel: null,
        error: null,
      });

      try {
        await this.handshake(deviceId, token);
        return true;
      } catch (e) {
        lastError = e;
        console.log(
          `BLE handshake attempt ${attempt}/${maxAttempts} for ${deviceId} failed:`,
          e
        );

        const session = this.sessions.get(deviceId);
        if (session && session.token === token) {
          this.clearSubscriptions(session);
        }

        // A failed attempt can leave a half-open GATT link behind. On
        // Android that makes the next attempt fail with status 133.
        await this.cancelConnection(deviceId);

        if (this.isStale(deviceId, token) || !isRetryable(e)) {
          break;
        }

        if (attempt < maxAttempts) {
          await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
        }
      }
    }

    // Keep the failed device in the list so the error can be shown
    this.updateState(deviceId, token, {
      status: "disconnected",
      attempt: 0,
      batteryLevel: null,
      error: describeError(lastError),
    });

    return false;
  }

  // One attempt: connect, discover services, read initial data, then
  // start watching for drops. Throws if any step fails.
  private async handshake(deviceId: string, token: number) {
    const manager = this.getManager();

    await manager.connectToDevice(deviceId, {
      timeout: CONNECT_TIMEOUT_MS,
      requestMTU:
        Platform.OS === "android" ? REQUESTED_MTU : undefined,
    });
    this.throwIfStale(deviceId, token);

    this.updateState(deviceId, token, { status: "discovering" });

    // Characteristics can only be read or monitored after discovery
    await manager.discoverAllServicesAndCharacteristicsForDevice(
      deviceId
    );
    this.throwIfStale(deviceId, token);

    // If the device requires bonding, Android shows its system pairing
    // dialog here, the first time a protected characteristic is read.
    const batteryLevel = await this.readBatteryLevel(deviceId);
    this.throwIfStale(deviceId, token);

    await this.startHeartRateMonitor(deviceId, token);
    this.throwIfStale(deviceId, token);

    this.watchForDisconnect(deviceId, token);

    this.updateState(deviceId, token, {
      status: "connected",
      attempt: 0,
      batteryLevel,
      error: null,
    });
  }

  private watchForDisconnect(deviceId: string, token: number) {
    const session = this.sessions.get(deviceId);

    if (!session) {
      return;
    }

    session.disconnectSubscription?.remove();
    session.disconnectSubscription =
      this.getManager().onDeviceDisconnected(deviceId, (error) => {
        const current = this.sessions.get(deviceId);

        // The app disconnected on purpose
        if (!current || current.token !== token) {
          return;
        }

        this.clearSubscriptions(current);
        console.log(`BLE device ${deviceId} disconnected unexpectedly:`, error);

        // The device went out of range or rebooted, so try to get it back.
        // Keeps the same token so the user can still cancel with
        // disconnect(deviceId).
        this.connectWithRetry(
          deviceId,
          token,
          MAX_AUTO_RECONNECT_ATTEMPTS,
          "reconnecting"
        );
      });
  }

  // Subscribes to Heart Rate Measurement notifications if the device has
  // the standard Heart Rate service. Devices without it are left alone.
  private async startHeartRateMonitor(deviceId: string, token: number) {
    const services = await this.getManager().servicesForDevice(deviceId);
    const hasHeartRate = services.some(
      (service) => canonicalGattUuid(service.uuid) === GATT.HEART_RATE_SERVICE
    );
    const session = this.sessions.get(deviceId);

    if (!hasHeartRate || !session || session.token !== token) {
      return;
    }

    session.heartRateSubscription?.remove();
    session.heartRateSubscription =
      this.getManager().monitorCharacteristicForDevice(
        deviceId,
        GATT.HEART_RATE_SERVICE,
        GATT.HEART_RATE_MEASUREMENT,
        (error, characteristic) => {
          // Errors here mean the link dropped or monitoring was stopped,
          // which the disconnect handling already deals with
          if (error || !characteristic?.value) {
            return;
          }

          const bpm = parseHeartRateMeasurement(characteristic.value);

          if (bpm !== null) {
            this.heartRateListeners.forEach((listener) =>
              listener(bpm, deviceId)
            );
          }
        }
      );
  }

  private clearSubscriptions(session: DeviceSession) {
    session.disconnectSubscription?.remove();
    session.disconnectSubscription = null;
    session.heartRateSubscription?.remove();
    session.heartRateSubscription = null;
  }

  // Standard Battery Level characteristic. Returns null if the device
  // doesn't expose it, since plenty of devices don't.
  private async readBatteryLevel(
    deviceId: string
  ): Promise<number | null> {
    try {
      const characteristic =
        await this.getManager().readCharacteristicForDevice(
          deviceId,
          GATT.BATTERY_SERVICE,
          GATT.BATTERY_LEVEL
        );

      if (!characteristic.value) {
        return null;
      }

      // One byte, 0-100, base64 encoded by ble-plx
      return atob(characteristic.value).charCodeAt(0);
    } catch {
      return null;
    }
  }

  private async cancelConnection(deviceId: string) {
    try {
      await this.getManager().cancelDeviceConnection(deviceId);
    } catch {
      // Already disconnected
    }
  }

  private isStale(deviceId: string, token: number) {
    return this.sessions.get(deviceId)?.token !== token;
  }

  private throwIfStale(deviceId: string, token: number) {
    if (this.isStale(deviceId, token)) {
      throw new StaleConnectionError("Connection cancelled");
    }
  }
}

function toScannedDevice(device: Device): ScannedDevice | null {
  const isHeartRateDevice =
    device.serviceUUIDs?.some(
      (uuid) => canonicalGattUuid(uuid) === GATT.HEART_RATE_SERVICE
    ) ?? false;
  const name = device.name ?? device.localName;

  // Skip anonymous beacons and trackers so the list stays readable, but
  // keep unnamed heart rate sensors: phone-based heart rate emulators and
  // some straps leave the name out to fit the small advertising packet
  if ((!name && !isHeartRateDevice) || device.rssi === null) {
    return null;
  }

  return {
    id: device.id,
    name: name ?? `Heart rate sensor (${device.id.slice(-5)})`,
    rssi: device.rssi,
    isHeartRateDevice,
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
