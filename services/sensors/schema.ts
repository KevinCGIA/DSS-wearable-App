import { Timestamp } from "@react-native-firebase/firestore";

// Firestore layout for wearable data, per user:
//
//   users/{uid}/sensor_readings/{type}/readings/{readingId}
//
// Each sensor type has its own "readings" subcollection, so the queries the
// app needs ("latest reading", "readings in the last 24 hours") only order or
// filter on `timestamp`. Single-field queries like these use Firestore's
// automatic indexes, so no composite indexes need to be set up in the console.

// What `value` means for each type:
//   heart_rate - beats per minute at `timestamp`
//   steps      - running total of steps for that calendar day at `timestamp`
//                (resets at midnight), which is how wearables report steps
export const SENSOR_TYPES = ["heart_rate", "steps"] as const;

export type SensorType = (typeof SENSOR_TYPES)[number];

export const SENSOR_UNITS: Record<SensorType, string> = {
  heart_rate: "bpm",
  steps: "steps",
};

// Where a reading came from. "manual" is for test data added in development.
export type ReadingSource = "ble" | "manual";

// Shape of a document in a readings subcollection
export type SensorReadingDoc = {
  value: number;
  unit: string;
  // When the device measured it (device/phone clock), not when it was saved
  timestamp: Timestamp;
  deviceId: string | null;
  deviceName: string | null;
  source: ReadingSource;
};

// Reading as used by the UI, with a plain Date
export type SensorReading = {
  id: string;
  type: SensorType;
  value: number;
  unit: string;
  timestamp: Date;
  deviceName: string | null;
  source: ReadingSource;
};
