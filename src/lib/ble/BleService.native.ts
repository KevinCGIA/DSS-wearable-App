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
import type { SensorType } from '@/data/types';
import {
  decodeBloodPressureMeasurement,
  decodeBodyCompositionMeasurement,
  decodeGlucoseMeasurement,
  decodeHeartRateMeasurement,
  decodePlxContinuous,
  decodePlxSpotCheck,
  decodeRscMeasurement,
  decodeTemperatureMeasurement,
  decodeWeightMeasurement,
  RACP_REPORT_ALL_RECORDS,
  rmssd,
} from '../biometrics/decoders';
import { type DeviceMeasure, measuresForServices, orderMeasures, SERVICE_UUIDS } from '../biometrics/metrics';
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
  // Health data this device provides (from its services, plus anything it has sent)
  measures?: DeviceMeasure[];
};

// One decoded value from a device. timestamp is set when the device recorded when it was
// measured (spot measurements); otherwise the value is "now".
export type MetricSample = { type: SensorType; value: number; timestamp?: Date };

const uuid16 = (short: string) => `0000${short}-0000-1000-8000-00805f9b34fb`;
const CHARACTERISTICS = {
  HEART_RATE_MEASUREMENT: uuid16('2a37'),
  PLX_CONTINUOUS: uuid16('2a5f'),
  PLX_SPOT_CHECK: uuid16('2a5e'),
  TEMPERATURE_MEASUREMENT: uuid16('2a1c'),
  BLOOD_PRESSURE_MEASUREMENT: uuid16('2a35'),
  RSC_MEASUREMENT: uuid16('2a53'),
  WEIGHT_MEASUREMENT: uuid16('2a9d'),
  BODY_COMPOSITION_MEASUREMENT: uuid16('2a9c'),
  GLUCOSE_MEASUREMENT: uuid16('2a18'),
  RECORD_ACCESS_CONTROL_POINT: uuid16('2a52'),
};

// HRV (RMSSD) is calculated from the RR intervals received over this window
const HRV_WINDOW_MS = 30000;

// Device clocks are often unset; ignore measurement times that can't be right
function measuredAt(timestamp: Date | null): Date | undefined {
  if (!timestamp) return undefined;
  const time = timestamp.getTime();
  const now = Date.now();
  return time > now - 30 * 86400000 && time < now + 5 * 60000 ? timestamp : undefined;
}

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
  private metricListeners = new Set<(samples: MetricSample[], deviceId: string, name: string | null) => void>();
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
  // Scans until a device matching `matches` is found, then stops. Resolves null if none is
  // found before the scan times out. Used for NFC pairing on iOS, which can't connect by
  // Bluetooth address and so has to find the device by name.
  async findDevice(matches: (device: ScannedDevice) => boolean): Promise<ScannedDevice | null> {
    return new Promise((resolve, reject) => {
      let found: ScannedDevice | null = null;
      this.startScan({
        onDevice: (device) => {
          if (!found && matches(device)) {
            found = device;
            void this.stopScan();
          }
        },
        onError: (message) => reject(new Error(message)),
        onStop: () => resolve(found),
      }).catch(reject);
    });
  }

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

  // Every decoded health value other than heart rate (see onHeartRate), per device
  onMetrics(listener: (samples: MetricSample[], deviceId: string, name: string | null) => void) {
    this.metricListeners.add(listener);
    return () => { this.metricListeners.delete(listener); };
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
    entry.connection.onMetrics((samples) => {
      if (this.sessions.get(key) !== entry || entry.cancelled) return;
      this.metricListeners.forEach((listener) => listener(samples, key, name));
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
  private healthSubscriptions: Subscription[] = [];
  private heartRateListeners = new Set<(bpm: number) => void>();
  private metricListeners = new Set<(samples: MetricSample[]) => void>();
  private rrBuffer: number[] = [];
  private rrWindowStart = 0;
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

  onMetrics(listener: (samples: MetricSample[]) => void): () => void {
    this.metricListeners.add(listener);
    return () => { this.metricListeners.delete(listener); };
  }

  private emitMetrics(samples: MetricSample[]) {
    if (samples.length) this.metricListeners.forEach((listener) => listener(samples));
  }

  // Adds measures a device turned out to send (e.g. HRV only once RR intervals arrive)
  private noteMeasures(found: DeviceMeasure[]) {
    const current = this.connection.measures ?? [];
    if (found.every((m) => current.includes(m))) return;
    this.setConnection({ measures: orderMeasures([...current, ...found]) });
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
    const measures = await this.startHealthMonitors(deviceId, token);
    this.throwIfStale(token);

    this.watchForDisconnect(deviceId, token);

    this.setConnection({
      status: "connected",
      attempt: 0,
      batteryLevel: null,
      measures,
      error: measures.some((m) => m !== 'activity_monitor')
        ? null
        : "This device doesn't provide heart rate or other supported health data.",
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

  // Subscribes to every standard health measurement the device offers (heart rate, pulse
  // oximeter, thermometer, blood pressure, running speed & cadence, weight scale, body
  // composition, glucose) and returns what it measures. Characteristics a device doesn't
  // implement just report an error to their callback, which is ignored.
  private async startHealthMonitors(deviceId: string, token: number): Promise<DeviceMeasure[]> {
    this.stopHeartRateMonitor();

    const services = await withDeadline(this.getManager().servicesForDevice(deviceId));
    this.throwIfStale(token);
    const uuids = services.map((service) => canonicalGattUuid(service.uuid));
    const has = (service: string) => uuids.includes(service);

    const monitor = (service: string, characteristic: string, handle: (value: string) => MetricSample[] | void) => {
      this.healthSubscriptions.push(
        this.getManager().monitorCharacteristicForDevice(deviceId, service, characteristic, (error, value) => {
          // Errors mean the link dropped, monitoring stopped, or the device lacks this one
          if (this.isStale(token) || error || !value?.value) return;
          const samples = handle(value.value);
          if (samples) this.emitMetrics(samples);
        }),
      );
    };

    if (has(GATT.HEART_RATE_SERVICE)) {
      this.rrBuffer = [];
      this.rrWindowStart = Date.now();
      monitor(GATT.HEART_RATE_SERVICE, CHARACTERISTICS.HEART_RATE_MEASUREMENT, (value) => {
        const measurement = decodeHeartRateMeasurement(value);
        const bpm = measurement?.bpm ?? parseHeartRateMeasurement(value);
        if (bpm !== null) this.heartRateListeners.forEach((listener) => listener(bpm));
        if (!measurement) return;
        const samples: MetricSample[] = [];
        if (measurement.energyKcal !== null) {
          samples.push({ type: 'energy', value: measurement.energyKcal });
          this.noteMeasures(['energy']);
        }
        if (measurement.rrIntervalsMs.length) {
          this.rrBuffer.push(...measurement.rrIntervalsMs);
          if (this.rrBuffer.length > 300) this.rrBuffer = this.rrBuffer.slice(-300);
          if (Date.now() - this.rrWindowStart >= HRV_WINDOW_MS) {
            const hrv = rmssd(this.rrBuffer);
            // Keep the newest interval so the next window's first difference is real
            this.rrBuffer = this.rrBuffer.slice(-1);
            this.rrWindowStart = Date.now();
            if (hrv !== null) {
              samples.push({ type: 'hrv', value: hrv });
              this.noteMeasures(['hrv']);
            }
          }
        }
        return samples;
      });
    }

    if (has(SERVICE_UUIDS.PULSE_OXIMETER)) {
      const oximetry = (decode: typeof decodePlxContinuous) => (value: string) => {
        const m = decode(value);
        if (!m) return;
        const at = measuredAt(m.timestamp);
        const samples: MetricSample[] = [{ type: 'spo2', value: m.spo2, timestamp: at }];
        // Pulse from an oximeter is heart rate too, unless the device has a Heart Rate service
        if (m.pulse !== null && !has(GATT.HEART_RATE_SERVICE)) {
          const pulse = m.pulse;
          this.heartRateListeners.forEach((listener) => listener(pulse));
        }
        return samples;
      };
      monitor(SERVICE_UUIDS.PULSE_OXIMETER, CHARACTERISTICS.PLX_CONTINUOUS, oximetry(decodePlxContinuous));
      monitor(SERVICE_UUIDS.PULSE_OXIMETER, CHARACTERISTICS.PLX_SPOT_CHECK, oximetry(decodePlxSpotCheck));
    }

    if (has(SERVICE_UUIDS.HEALTH_THERMOMETER)) {
      monitor(SERVICE_UUIDS.HEALTH_THERMOMETER, CHARACTERISTICS.TEMPERATURE_MEASUREMENT, (value) => {
        const m = decodeTemperatureMeasurement(value);
        return m ? [{ type: 'body_temperature', value: m.celsius, timestamp: measuredAt(m.timestamp) }] : undefined;
      });
    }

    if (has(SERVICE_UUIDS.BLOOD_PRESSURE)) {
      monitor(SERVICE_UUIDS.BLOOD_PRESSURE, CHARACTERISTICS.BLOOD_PRESSURE_MEASUREMENT, (value) => {
        const m = decodeBloodPressureMeasurement(value);
        if (!m) return;
        // Both halves share one time so they stay paired, even without a device clock
        const at = measuredAt(m.timestamp) ?? new Date();
        return [
          { type: 'bp_systolic', value: m.systolic, timestamp: at },
          { type: 'bp_diastolic', value: m.diastolic, timestamp: at },
        ];
      });
    }

    if (has(SERVICE_UUIDS.RUNNING_SPEED_CADENCE)) {
      monitor(SERVICE_UUIDS.RUNNING_SPEED_CADENCE, CHARACTERISTICS.RSC_MEASUREMENT, (value) => {
        const m = decodeRscMeasurement(value);
        if (!m) return;
        const samples: MetricSample[] = [
          { type: 'cadence', value: m.cadence },
          { type: 'speed', value: m.speedKmh },
        ];
        if (m.strideLengthM !== null) {
          samples.push({ type: 'stride_length', value: m.strideLengthM });
          this.noteMeasures(['stride_length']);
        }
        if (m.totalDistanceM !== null) {
          samples.push({ type: 'distance', value: m.totalDistanceM });
          this.noteMeasures(['distance']);
        }
        return samples;
      });
    }

    if (has(SERVICE_UUIDS.WEIGHT_SCALE)) {
      monitor(SERVICE_UUIDS.WEIGHT_SCALE, CHARACTERISTICS.WEIGHT_MEASUREMENT, (value) => {
        const m = decodeWeightMeasurement(value);
        if (!m) return;
        const at = measuredAt(m.timestamp) ?? new Date();
        const samples: MetricSample[] = [{ type: 'weight', value: m.kg, timestamp: at }];
        if (m.bmi !== null) {
          samples.push({ type: 'bmi', value: m.bmi, timestamp: at });
          this.noteMeasures(['bmi']);
        }
        return samples;
      });
    }

    if (has(SERVICE_UUIDS.BODY_COMPOSITION)) {
      monitor(SERVICE_UUIDS.BODY_COMPOSITION, CHARACTERISTICS.BODY_COMPOSITION_MEASUREMENT, (value) => {
        const m = decodeBodyCompositionMeasurement(value);
        if (!m) return;
        const at = measuredAt(m.timestamp) ?? new Date();
        const samples: MetricSample[] = [{ type: 'body_fat', value: m.bodyFatPercent, timestamp: at }];
        if (m.weightKg !== null && !has(SERVICE_UUIDS.WEIGHT_SCALE)) {
          samples.push({ type: 'weight', value: m.weightKg, timestamp: at });
          this.noteMeasures(['weight']);
        }
        return samples;
      });
    }

    if (has(SERVICE_UUIDS.GLUCOSE)) {
      monitor(SERVICE_UUIDS.GLUCOSE, CHARACTERISTICS.GLUCOSE_MEASUREMENT, (value) => {
        const m = decodeGlucoseMeasurement(value);
        if (!m || m.mmolPerL === null) return;
        return [{ type: 'glucose', value: m.mmolPerL, timestamp: measuredAt(m.timestamp) ?? new Date() }];
      });
      // Glucose meters only send stored records when asked through the Record Access
      // Control Point, whose responses are indications that must be enabled first
      monitor(SERVICE_UUIDS.GLUCOSE, CHARACTERISTICS.RECORD_ACCESS_CONTROL_POINT, () => undefined);
      setTimeout(() => {
        if (this.isStale(token)) return;
        void this.getManager()
          .writeCharacteristicWithResponseForDevice(
            deviceId,
            SERVICE_UUIDS.GLUCOSE,
            CHARACTERISTICS.RECORD_ACCESS_CONTROL_POINT,
            RACP_REPORT_ALL_RECORDS,
          )
          .catch(() => undefined);
      }, 500);
    }

    return measuresForServices(uuids);
  }

  private stopHeartRateMonitor() {
    this.healthSubscriptions.forEach((subscription) => subscription.remove());
    this.healthSubscriptions = [];
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
  const isHeartRateDevice =
    device.serviceUUIDs?.some(
      (uuid) => canonicalGattUuid(uuid) === GATT.HEART_RATE_SERVICE
    ) ?? false;
  const name = device.name ?? device.localName;

  // Skip anonymous beacons and trackers so the list stays readable, but keep unnamed
  // heart rate sensors: phone-based heart rate emulators and some straps leave the name
  // out to fit the small advertising packet
  if ((!name && !isHeartRateDevice) || device.rssi === null) {
    return null;
  }

  return {
    id: deviceKey(Platform.OS === "ios" ? "ios" : "android", device.id),
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
