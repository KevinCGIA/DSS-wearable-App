import {
  addDoc,
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  doc,
  Timestamp,
  where,
  writeBatch,
} from "@react-native-firebase/firestore";

import {
  ReadingSource,
  SENSOR_UNITS,
  SensorReading,
  SensorReadingDoc,
  SensorType,
} from "./schema";

function readingsCollection(uid: string, type: SensorType) {
  return collection(
    getFirestore(),
    "users",
    uid,
    "sensor_readings",
    type,
    "readings"
  );
}

function toReading(
  id: string,
  type: SensorType,
  raw: unknown
): SensorReading {
  const data = raw as SensorReadingDoc;

  return {
    id,
    type,
    value: data.value,
    unit: data.unit,
    timestamp: data.timestamp.toDate(),
    deviceName: data.deviceName ?? null,
    source: data.source,
  };
}

// Listens for the most recent reading of one type for a user. Calls
// onReading with null when the user has no readings yet. Updates live
// as new readings are saved. Returns an unsubscribe function.
export function subscribeToLatestReading(
  uid: string,
  type: SensorType,
  onReading: (reading: SensorReading | null) => void,
  onError: (error: Error) => void
): () => void {
  const latestQuery = query(
    readingsCollection(uid, type),
    orderBy("timestamp", "desc"),
    limit(1)
  );

  return onSnapshot(
    latestQuery,
    (snapshot) => {
      const doc = snapshot.docs[0];

      if (!doc) {
        onReading(null);
        return;
      }

      onReading(toReading(doc.id, type, doc.data()));
    },
    onError
  );
}

// Listens for all readings of one type since a point in time, oldest first.
// Used for trend charts. Returns an unsubscribe function.
export function subscribeToReadingsSince(
  uid: string,
  type: SensorType,
  since: Date,
  onReadings: (readings: SensorReading[]) => void,
  onError: (error: Error) => void
): () => void {
  const sinceQuery = query(
    readingsCollection(uid, type),
    where("timestamp", ">=", Timestamp.fromDate(since)),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(
    sinceQuery,
    (snapshot) => {
      onReadings(snapshot.docs.map((doc) => toReading(doc.id, type, doc.data())));
    },
    onError
  );
}

export async function addSensorReading(
  uid: string,
  type: SensorType,
  reading: {
    value: number;
    timestamp?: Date;
    deviceId?: string | null;
    deviceName?: string | null;
    source: ReadingSource;
  }
): Promise<void> {
  const doc: SensorReadingDoc = {
    value: reading.value,
    unit: SENSOR_UNITS[type],
    timestamp: Timestamp.fromDate(reading.timestamp ?? new Date()),
    deviceId: reading.deviceId ?? null,
    deviceName: reading.deviceName ?? null,
    source: reading.source,
  };

  await addDoc(readingsCollection(uid, type), doc);
}

// Development only: fills the last 24 hours with realistic-looking heart rate
// (every 15 min) and step (hourly running total) readings, so the charts can
// be tested without a wearable. One batched write.
export async function addSampleDay(uid: string): Promise<void> {
  const batch = writeBatch(getFirestore());
  const now = Date.now();
  const start = now - 24 * 60 * 60 * 1000;

  const add = (type: SensorType, value: number, time: number) => {
    const sample: SensorReadingDoc = {
      value,
      unit: SENSOR_UNITS[type],
      timestamp: Timestamp.fromDate(new Date(time)),
      deviceId: null,
      deviceName: "Sample data",
      source: "manual",
    };
    batch.set(doc(readingsCollection(uid, type)), sample);
  };

  for (let t = start; t <= now; t += 15 * 60 * 1000) {
    const hour = new Date(t).getHours();
    const asleep = hour < 7 || hour >= 23;
    const base = asleep ? 55 : 72;
    add("heart_rate", base + Math.round(Math.random() * 18), t);
  }

  let dayTotal = 0;
  let day = new Date(start).getDate();

  for (let t = start; t <= now; t += 60 * 60 * 1000) {
    const date = new Date(t);

    if (date.getDate() !== day) {
      day = date.getDate();
      dayTotal = 0;
    }

    const hour = date.getHours();
    const active = hour >= 7 && hour < 22;
    dayTotal += active ? 200 + Math.round(Math.random() * 900) : 0;
    add("steps", dayTotal, t);
  }

  await batch.commit();
}
