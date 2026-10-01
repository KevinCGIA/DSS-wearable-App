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
  REQUESTED_MTU,
  RETRY_BASE_DELAY_MS,
  SCAN_TIMEOUT_MS,
} from "./constants";

export type ScannedDevice = {
  id: string;
  name: string;
  rssi: number;
  // Advertises the standard Heart Rate service, so it's likely a wearable
  isHeartRateDevice: boolean;
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
};

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

class BleService {
  private manager: BleManager | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private scanCallbacks: ScanCallbacks | null = null;
  private disconnectSubscription: Subscription | null = null;
  private connection: ConnectionState = INITIAL_CONNECTION;
  private listeners = new Set<(state: ConnectionState) => void>();

  // Bumped whenever the user connects, disconnects or switches device.
  // Any in-flight handshake or reconnect loop holding an older token
  // stops at its next checkpoint, which makes cancelling safe.
  private connectionToken = 0;

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

    // Passing null UUIDs finds every nearby device. Many watches, including
    // Galaxy Watch, don't advertise the Heart Rate service until an app on
    // the watch starts it, so filtering by it would hide them.
    try {
      await manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        async (error, device) => {
          if (error) {
            // The native scan has already stopped at this point
            this.finishScan();
            callbacks.onError(describeError(error));
            return;
          }

          const scanned = device ? toScannedDevice(device) : null;

          if (scanned) {
            callbacks.onDevice(scanned);
          }
        }
      );
    } catch (e) {
      this.finishScan();
      throw new Error(describeError(e));
    }

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
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }

    const callbacks = this.scanCallbacks;
    this.scanCallbacks = null;
    callbacks?.onStop();
  }

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

  private setConnection(update: Partial<ConnectionState>) {
    this.connection = { ...this.connection, ...update };
    this.listeners.forEach((listener) => listener(this.connection));
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

    // Android connects much less reliably while a scan is running
    await this.stopScan();

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

    if (!deviceId) {
      return;
    }

    this.setConnection({ status: "disconnecting" });
    await this.cancelConnection(deviceId);
    this.setConnection(INITIAL_CONNECTION);
  }

  private async connectWithRetry(
    deviceId: string,
    deviceName: string | null,
    token: number,
    maxAttempts: number,
    status: "connecting" | "reconnecting"
  ): Promise<boolean> {
    let lastError: unknown = null;

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

      try {
        await this.handshake(deviceId, token);
        return true;
      } catch (e) {
        lastError = e;
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
    this.throwIfStale(token);

    this.setConnection({ status: "discovering" });

    // Characteristics can only be read or monitored after discovery
    await manager.discoverAllServicesAndCharacteristicsForDevice(
      deviceId
    );
    this.throwIfStale(token);

    // If the device requires bonding, Android shows its system pairing
    // dialog here, the first time a protected characteristic is read.
    const batteryLevel = await this.readBatteryLevel(deviceId);
    this.throwIfStale(token);

    this.watchForDisconnect(deviceId, token);

    this.setConnection({
      status: "connected",
      attempt: 0,
      batteryLevel,
      error: null,
    });
  }

  private watchForDisconnect(deviceId: string, token: number) {
    this.clearDisconnectSubscription();

    this.disconnectSubscription =
      this.getManager().onDeviceDisconnected(deviceId, (error) => {
        this.clearDisconnectSubscription();

        // The app disconnected on purpose
        if (this.isStale(token)) {
          return;
        }

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
  if (!name) {
    return null;
  }

  return {
    id: device.id,
    name,
    rssi: device.rssi ?? -100,
    isHeartRateDevice:
      device.serviceUUIDs?.some(
        (uuid) => uuid.toLowerCase() === GATT.HEART_RATE_SERVICE
      ) ?? false,
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
