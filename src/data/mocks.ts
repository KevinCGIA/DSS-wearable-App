import type {
  AlertItem,
  AlertThresholds,
  BluetoothState,
  ConnectionState,
  ConnectionStatus,
  DailyActivityExtras,
  HistoryState,
  LatestReadingState,
  PairedDevice,
  Preferences,
  ScannedDevice,
  SensorReading,
  SensorType,
  RestingHrTrends,
  SleepSummary,
  SleepTrends,
  UserProfile,
} from './types';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const DEVICE_ID = 'C2:4F:8A:11:93:7E';
const DEVICE_NAME = 'Galaxy Watch8';

// Deterministic wobble so previews look the same on every render.
function wave(index: number, spread: number): number {
  return Math.round(((Math.sin(index * 1.7) + Math.sin(index * 0.6)) / 2) * spread);
}

export const mockProfile: UserProfile = {
  uid: 'preview-uid',
  name: 'Tarun',
  email: '',
  emailVerified: true,
  height: 178,
  weight: 72,
  avatarData: null,
};

export const mockProfileNoName: UserProfile = { ...mockProfile, name: '' };

export const disconnectedConnection: ConnectionState = {
  status: 'disconnected',
  deviceId: null,
  deviceName: null,
  attempt: 0,
  batteryLevel: null,
  error: null,
};

export const connectedConnection: ConnectionState = {
  status: 'connected',
  deviceId: DEVICE_ID,
  deviceName: DEVICE_NAME,
  attempt: 0,
  batteryLevel: 85,
  error: null,
};

export const failedConnection: ConnectionState = {
  ...disconnectedConnection,
  error: "Couldn't reach the device. Make sure it's nearby and awake.",
};

export function connectionIn(status: ConnectionStatus, attempt = 1): ConnectionState {
  if (status === 'connected') return connectedConnection;
  if (status === 'disconnected') return disconnectedConnection;
  return {
    status,
    deviceId: DEVICE_ID,
    deviceName: DEVICE_NAME,
    attempt: status === 'connecting' || status === 'reconnecting' ? attempt : 0,
    batteryLevel: null,
    error: null,
  };
}

export const bluetoothStates: BluetoothState[] = [
  'PoweredOn',
  'PoweredOff',
  'Unauthorized',
  'Unsupported',
  'Resetting',
];

export const mockScannedDevices: ScannedDevice[] = [
  { id: DEVICE_ID, name: DEVICE_NAME, rssi: -54, isHeartRateDevice: true },
  { id: 'E1:02:7B:44:C0:19', name: 'Polar H10', rssi: -67, isHeartRateDevice: true },
  { id: '5A:9C:31:D2:08:B4', name: 'JBL Flip 6', rssi: -78, isHeartRateDevice: false },
  { id: '7F:11:E4:62:AA:03', name: 'Mi Smart Band 8', rssi: -88, isHeartRateDevice: false },
];

export const mockPairedDevices: PairedDevice[] = [
  {
    deviceId: DEVICE_ID,
    name: DEVICE_NAME,
    addedAt: new Date(Date.now() - 12 * DAY),
    lastConnectedAt: new Date(Date.now() - 2 * MINUTE),
  },
  {
    deviceId: 'E1:02:7B:44:C0:19',
    name: 'Polar H10',
    addedAt: new Date(Date.now() - 30 * DAY),
    lastConnectedAt: new Date(Date.now() - 3 * DAY),
  },
];

function reading(type: SensorType, value: number, timestamp: Date, index = 0): SensorReading {
  return {
    id: `${type}-${index}`,
    type,
    value,
    unit: type === 'heart_rate' ? 'bpm' : 'steps',
    timestamp,
    deviceName: DEVICE_NAME,
    source: 'ble',
  };
}

export const emptyLatest: LatestReadingState = { reading: null, loading: false, error: null };
export const loadingLatest: LatestReadingState = { reading: null, loading: true, error: null };
export const errorLatest: LatestReadingState = {
  reading: null,
  loading: false,
  error: "Couldn't load your latest reading.",
};

export function heartRateLatest(bpm = 72, ageMs = 30 * 1000): LatestReadingState {
  return {
    reading: reading('heart_rate', bpm, new Date(Date.now() - ageMs)),
    loading: false,
    error: null,
  };
}

export function stepsLatest(steps = 6842, ageMs = 5 * MINUTE): LatestReadingState {
  return {
    reading: reading('steps', steps, new Date(Date.now() - ageMs)),
    loading: false,
    error: null,
  };
}

export function emptyHistory(): HistoryState {
  const end = Date.now();
  return { readings: [], start: end - DAY, end, loading: false, error: null };
}

export function loadingHistory(): HistoryState {
  return { ...emptyHistory(), loading: true };
}

export function errorHistory(): HistoryState {
  return { ...emptyHistory(), error: "Couldn't load your history." };
}

// Every 15 minutes for 24h, lower overnight, matching Android's addSampleDay.
export function heartRateHistory(): HistoryState {
  const end = Date.now();
  const start = end - DAY;
  const readings: SensorReading[] = [];
  let index = 0;
  for (let t = start + MINUTE; t < end; t += 15 * MINUTE) {
    const hour = new Date(t).getHours();
    const asleep = hour < 7 || hour >= 23;
    const value = (asleep ? 58 : 76) + wave(index, 9);
    readings.push(reading('heart_rate', value, new Date(t), index));
    index += 1;
  }
  return { readings, start, end, loading: false, error: null };
}

// Hourly running daily totals; today's total ends at `todayTotal`.
export function stepsHistory(todayTotal = 6842): HistoryState {
  const end = Date.now();
  const start = end - DAY;
  const midnight = new Date(end);
  midnight.setHours(0, 0, 0, 0);

  const hours: number[] = [];
  for (let t = start + MINUTE; t < end; t += HOUR) hours.push(t);

  const active = (t: number) => {
    const hour = new Date(t).getHours();
    return hour >= 7 && hour < 22;
  };
  const weight = (t: number, i: number) => (active(t) ? 4 + wave(i, 3) : 0);

  const todayHours = hours.filter((t) => t >= midnight.getTime());
  const todayWeights = todayHours.map((t, i) => weight(t, i));
  const todaySum = todayWeights.reduce((sum, w) => sum + w, 0) || 1;

  const readings: SensorReading[] = [];
  let yesterday = 0;
  let today = 0;
  let todayIndex = 0;
  hours.forEach((t, i) => {
    if (t < midnight.getTime()) {
      yesterday += weight(t, i) * 110;
      readings.push(reading('steps', yesterday, new Date(t), i));
    } else {
      today += todayWeights[todayIndex] / todaySum;
      todayIndex += 1;
      const value = todayIndex === todayHours.length ? todayTotal : Math.round(today * todayTotal);
      readings.push(reading('steps', value, new Date(t), i));
    }
  });

  return { readings, start, end, loading: false, error: null };
}

export const mockSleep: SleepSummary = {
  totalMinutes: 462,
  score: 86,
  rating: 'Optimal',
  start: '12:57am',
  end: '9:07am',
  stages: [
    {
      key: 'awake',
      minutes: 28,
      segments: [
        { start: 0, width: 0.04 },
        { start: 0.46, width: 0.03 },
        { start: 0.94, width: 0.06 },
      ],
    },
    {
      key: 'rem',
      minutes: 82,
      segments: [
        { start: 0.18, width: 0.07 },
        { start: 0.42, width: 0.06 },
        { start: 0.64, width: 0.05 },
        { start: 0.84, width: 0.08 },
      ],
    },
    {
      key: 'light',
      minutes: 310,
      segments: [
        { start: 0.05, width: 0.12 },
        { start: 0.26, width: 0.15 },
        { start: 0.5, width: 0.13 },
        { start: 0.7, width: 0.13 },
        { start: 0.88, width: 0.06 },
      ],
    },
    {
      key: 'deep',
      minutes: 70,
      segments: [
        { start: 0.1, width: 0.09 },
        { start: 0.34, width: 0.07 },
        { start: 0.58, width: 0.05 },
      ],
    },
  ],
};

export const mockSleepTrends: SleepTrends = {
  week: {
    score: [
      { label: 'Mon', value: 91 },
      { label: 'Tue', value: 87 },
      { label: 'Wed', value: 65 },
      { label: 'Thu', value: 69 },
      { label: 'Fri', value: 59 },
      { label: 'Sat', value: 91 },
      { label: 'Sun', value: 86 },
    ],
    hours: [
      { label: 'Mon', value: 8.1 },
      { label: 'Tue', value: 7.8 },
      { label: 'Wed', value: 6.2 },
      { label: 'Thu', value: 6.5 },
      { label: 'Fri', value: 5.4 },
      { label: 'Sat', value: 8.4 },
      { label: 'Sun', value: 7.7 },
    ],
  },
  month: {
    score: [
      { label: 'W1', value: 82 },
      { label: 'W2', value: 74 },
      { label: 'W3', value: 88 },
      { label: 'W4', value: 79 },
    ],
    hours: [
      { label: 'W1', value: 7.4 },
      { label: 'W2', value: 6.8 },
      { label: 'W3', value: 7.9 },
      { label: 'W4', value: 7.2 },
    ],
  },
};

// Moved off the Sleep tab; shown on the Heart Rate tab in Task 3.
export const mockRestingHrTrends: RestingHrTrends = {
  week: [
    { label: 'Mon', value: 58 },
    { label: 'Tue', value: 57 },
    { label: 'Wed', value: 63 },
    { label: 'Thu', value: 62 },
    { label: 'Fri', value: 66 },
    { label: 'Sat', value: 57 },
    { label: 'Sun', value: 56 },
  ],
  month: [
    { label: 'W1', value: 59 },
    { label: 'W2', value: 62 },
    { label: 'W3', value: 57 },
    { label: 'W4', value: 60 },
  ],
};

export const mockAlertThresholds: AlertThresholds = { hrMin: 50, hrMax: 120, enabled: true };

export const mockAlerts: AlertItem[] = [
  {
    id: 'a1',
    type: 'HR_HIGH',
    value: 134,
    message: 'Heart rate above 120 BPM',
    timestamp: Date.now() - 40 * MINUTE,
  },
  {
    id: 'a2',
    type: 'HR_LOW',
    value: 46,
    message: 'Heart rate below 50 BPM',
    timestamp: Date.now() - 9 * HOUR,
  },
  {
    id: 'a3',
    type: 'HR_HIGH',
    value: 128,
    message: 'Heart rate above 120 BPM',
    timestamp: Date.now() - DAY - 2 * HOUR,
  },
];

export const noActivityExtras: DailyActivityExtras = {
  distanceKm: null,
  floors: null,
  activeCalories: null,
  calorieTarget: 600,
};

export const mockActivityExtras: DailyActivityExtras = {
  distanceKm: 4.8,
  floors: 12,
  activeCalories: 486,
  calorieTarget: 600,
};

export const defaultPreferences: Preferences = {
  textScale: 'default',
  units: 'metric',
  notifications: true,
};

// Ready-made sets for the two default flows.
export const noDeviceMock = {
  profile: mockProfile,
  connection: disconnectedConnection,
  heartRate: emptyLatest,
  steps: { ...emptyLatest },
  sleep: null as SleepSummary | null,
  activity: noActivityExtras,
  pairedDevices: [] as PairedDevice[],
  autoConnect: true,
};

export const connectedMock = {
  profile: mockProfile,
  connection: connectedConnection,
  heartRate: heartRateLatest(),
  steps: stepsLatest(),
  sleep: mockSleep,
  activity: mockActivityExtras,
  pairedDevices: mockPairedDevices,
  autoConnect: true,
};
