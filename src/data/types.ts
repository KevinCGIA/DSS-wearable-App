// Mirrors the Android app (origin/feature/ble-connection) so containers swap 1:1 in Phase 2.

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  emailVerified: boolean;
  height: number | null;
  weight: number | null;
  avatarData: string | null;
};

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'discovering'
  | 'connected'
  | 'reconnecting'
  | 'disconnecting';

export type ConnectionState = {
  status: ConnectionStatus;
  deviceId: string | null;
  deviceName: string | null;
  attempt: number;
  batteryLevel: number | null;
  error: string | null;
  // iOS addition (in-app only, not stored): last known signal. Phase 2: readRSSI while connected.
  rssi?: number | null;
  modelNumber?: string | null;
  firmwareRevision?: string | null;
};

// Same string values as react-native-ble-plx's State enum.
export type BluetoothState =
  | 'Unknown'
  | 'Resetting'
  | 'Unsupported'
  | 'Unauthorized'
  | 'PoweredOff'
  | 'PoweredOn';

export type ScannedDevice = {
  id: string;
  name: string;
  rssi: number;
  isHeartRateDevice: boolean;
  serviceUUIDs?: string[];
};

export type PairedDevice = {
  deviceId: string;
  name: string;
  addedAt: Date | null;
  lastConnectedAt: Date | null;
  platform?: 'ios' | 'android';
  localName?: string;
  serviceUUIDs?: string[];
  // Optional additions (shared data compatibility rule): Android docs without them still work.
  lastRssi?: number | null;
  lastBattery?: number | null;
  modelNumber?: string | null;
  firmwareRevision?: string | null;
};

export type SensorType = 'heart_rate' | 'steps';

export type ReadingSource = 'ble' | 'manual' | 'test';

// For steps, value is the running total for that calendar day.
export type SensorReading = {
  id: string;
  type: SensorType;
  value: number;
  unit: string;
  timestamp: Date;
  // Source device, as stored in Android's Firestore doc. null for test/sample data.
  deviceId: string | null;
  deviceName: string | null;
  source: ReadingSource;
  resolution?: 'sample' | 'representative';
};

export type LatestReadingState = {
  reading: SensorReading | null;
  loading: boolean;
  error: string | null;
};

export type HistoryState = {
  readings: SensorReading[];
  start: number;
  end: number;
  loading: boolean;
  error: string | null;
};

// iOS only below: no Android backend yet.

export type SleepStageKey = 'awake' | 'rem' | 'light' | 'deep';

export type SleepStage = {
  key: SleepStageKey;
  minutes: number;
  segments: { start: number; width: number }[];
};

export type SleepSummary = {
  totalMinutes: number;
  score: number;
  rating: string;
  start: string;
  end: string;
  stages: SleepStage[];
};

export type AlertThresholds = { hrMin: number; hrMax: number; enabled: boolean };

export type AlertItem = {
  id: string;
  type: 'HR_HIGH' | 'HR_LOW';
  value: number;
  message: string;
  timestamp: number;
  deviceId?: string | null;
  deviceName?: string | null;
};

export type Preferences = {
  textScale: 'default' | 'large' | 'xlarge';
  units: 'metric' | 'imperial';
  notifications: boolean;
};

export type DailyActivityExtras = {
  distanceKm: number | null;
  floors: number | null;
  activeCalories: number | null;
};

export type TrendPoint = { label: string; value: number };

export type SleepTrends = {
  week: { score: TrendPoint[]; hours: TrendPoint[] };
  month: { score: TrendPoint[]; hours: TrendPoint[] };
};

export type RestingHrTrends = { week: TrendPoint[]; month: TrendPoint[] };
