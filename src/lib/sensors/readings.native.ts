import { getAuth } from '@react-native-firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';
import type { ReadingSource, SensorReading, SensorType } from '@/data/types';
import { HEART_RATE_SAVE_INTERVAL_MS } from '@/lib/ble/constants';

// Native readings store: the Firestore version of readings.ts (Phase 2 B3), with the same
// exports so nothing else changes. Web and Previews keep using the in-memory readings.ts.
//
// Firestore layout (Kevin's Android format, unchanged):
//   users/{uid}/sensor_readings/{type}/readings/{id}
//   { value, unit, timestamp, deviceId, deviceName, source }
//
// - History comes from Firestore, so it survives an app restart. One listener per type for
//   the signed-in user covers the last HISTORY_DAYS; screens filter it to their own window.
// - Live BLE heart rate arrives about once a second. Every sample is kept in memory for
//   LIVE_BUFFER_MS so the Dashboard and Activity update straight away, and one sample per
//   device per HEART_RATE_SAVE_INTERVAL_MS is saved to Firestore (Kevin's rate).
// - Test and sample data are written to Firestore with source 'manual' ("Test data").
// - Firestore's offline cache shows local writes immediately and syncs them later.

// Cap on how much history is read: at one reading a minute, 30 days of heart rate would be
// ~43k document reads per device each time (Firestore's free tier is 50k reads a day).
const HISTORY_DAYS = 7;
const LIVE_BUFFER_MS = 15 * 60 * 1000;

const UNITS: Record<SensorType, string> = { heart_rate: 'bpm', steps: 'steps' };
const TYPES: SensorType[] = ['heart_rate', 'steps'];

type Store = {
  persisted: SensorReading[];
  live: SensorReading[];
  merged: SensorReading[];
};

const stores: Record<SensorType, Store> = {
  heart_rate: { persisted: [], live: [], merged: [] },
  steps: { persisted: [], live: [], merged: [] },
};
const listeners = new Set<() => void>();
const firestoreUnsubscribes: Partial<Record<SensorType, () => void>> = {};
const lastSavedAt = new Map<string, number>();
let listeningUid: string | null = null;
let nextLiveId = 1;

function currentUid(): string | null {
  return getAuth().currentUser?.uid ?? null;
}

function readingsCollection(uid: string, type: SensorType) {
  return collection(getFirestore(), 'users', uid, 'sensor_readings', type, 'readings');
}

function emit() {
  listeners.forEach((listener) => listener());
}

// A live sample and its saved copy share deviceId and timestamp; show it once.
function key(reading: SensorReading) {
  return `${reading.deviceId ?? '-'}|${reading.timestamp.getTime()}`;
}

function rebuild(type: SensorType) {
  const store = stores[type];
  const seen = new Set<string>();
  const merged: SensorReading[] = [];

  for (const reading of [...store.persisted, ...store.live]) {
    const k = key(reading);
    if (!seen.has(k)) {
      seen.add(k);
      merged.push(reading);
    }
  }

  merged.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  store.merged = merged;
}

function toReading(id: string, type: SensorType, data: Record<string, any>): SensorReading | null {
  if (typeof data.value !== 'number' || !data.timestamp?.toDate) return null;

  return {
    id,
    type,
    value: data.value,
    unit: data.unit ?? UNITS[type],
    timestamp: data.timestamp.toDate(),
    deviceId: data.deviceId ?? null,
    deviceName: data.deviceName ?? null,
    source: data.source === 'manual' ? 'manual' : 'ble',
  };
}

// Starts (or restarts, after an account change) the Firestore listeners
function ensureListening() {
  const uid = currentUid();
  if (uid === listeningUid) return;

  stopListening();
  listeningUid = uid;
  if (!uid) return;

  const since = Timestamp.fromDate(new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000));

  for (const type of TYPES) {
    firestoreUnsubscribes[type] = onSnapshot(
      query(readingsCollection(uid, type), where('timestamp', '>=', since), orderBy('timestamp', 'asc')),
      (snapshot) => {
        stores[type].persisted = snapshot.docs
          .map((d) => toReading(d.id, type, d.data()))
          .filter((r): r is SensorReading => r !== null);
        rebuild(type);
        emit();
      },
      (error) => {
        // e.g. permission-denied from the security rules. Live readings still show;
        // history and saving need the rules to allow users/{uid}/sensor_readings.
        console.warn(`Couldn't load saved ${type} readings:`, error);
        stores[type].persisted = [];
        rebuild(type);
        emit();
      },
    );
  }
}

function stopListening() {
  for (const type of TYPES) {
    firestoreUnsubscribes[type]?.();
    delete firestoreUnsubscribes[type];
  }
  listeningUid = null;
}

// Called by the BLE provider on sign-in, sign-out and unmount.
export function clearReadings() {
  stopListening();
  for (const type of TYPES) {
    stores[type] = { persisted: [], live: [], merged: [] };
  }
  lastSavedAt.clear();
  emit();
}

export function subscribeToLatestReading(
  _uid: string,
  type: SensorType,
  onReading: (reading: SensorReading | null) => void,
  _onError: (error: Error) => void,
): () => void {
  ensureListening();
  const listener = () => {
    const list = stores[type].merged;
    onReading(list.length ? list[list.length - 1] : null);
  };
  listeners.add(listener);
  listener();
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeToReadingsSince(
  _uid: string,
  type: SensorType,
  since: Date,
  onReadings: (readings: SensorReading[]) => void,
  _onError: (error: Error) => void,
): () => void {
  ensureListening();
  const listener = () => onReadings(stores[type].merged.filter((r) => r.timestamp >= since));
  listeners.add(listener);
  listener();
  return () => {
    listeners.delete(listener);
  };
}

async function save(uid: string, type: SensorType, reading: SensorReading) {
  try {
    await addDoc(readingsCollection(uid, type), {
      value: reading.value,
      unit: reading.unit,
      timestamp: Timestamp.fromDate(reading.timestamp),
      deviceId: reading.deviceId,
      deviceName: reading.deviceName,
      source: reading.source,
    });
  } catch (error) {
    console.warn(`Couldn't save ${type} reading:`, error);
  }
}

export async function addSensorReading(
  _uid: string,
  type: SensorType,
  reading: {
    value: number;
    timestamp?: Date;
    deviceId?: string | null;
    deviceName?: string | null;
    source: ReadingSource;
  },
): Promise<void> {
  ensureListening();
  const uid = currentUid();
  const full: SensorReading = {
    id: `live-${nextLiveId++}`,
    type,
    value: reading.value,
    unit: UNITS[type],
    timestamp: reading.timestamp ?? new Date(),
    deviceId: reading.deviceId ?? null,
    deviceName: reading.deviceName ?? null,
    source: reading.source,
  };

  if (reading.source === 'manual') {
    // Test data: saved straight away (the listener shows it, even offline)
    if (uid) await save(uid, type, full);
    return;
  }

  // Live BLE sample: show it now, keep only the recent buffer in memory
  const store = stores[type];
  const cutoff = Date.now() - LIVE_BUFFER_MS;
  store.live = [...store.live.filter((r) => r.timestamp.getTime() >= cutoff), full];
  rebuild(type);
  emit();

  // Save at most one per device per interval
  const saveKey = `${type}|${full.deviceId ?? '-'}`;
  const now = full.timestamp.getTime();
  if (uid && now - (lastSavedAt.get(saveKey) ?? 0) >= HEART_RATE_SAVE_INTERVAL_MS) {
    lastSavedAt.set(saveKey, now);
    await save(uid, type, full);
  }
}

// Same as Android's addSampleDay: heart rate every 15 min, steps as an hourly running daily
// total, all labelled Test data. One batched write.
export async function addSampleDay(_uid: string): Promise<void> {
  const uid = currentUid();
  if (!uid) return;
  ensureListening();

  const batch = writeBatch(getFirestore());
  const now = Date.now();
  const start = now - 24 * 60 * 60 * 1000;
  const add = (type: SensorType, value: number, time: number) =>
    batch.set(doc(readingsCollection(uid, type)), {
      value,
      unit: UNITS[type],
      timestamp: Timestamp.fromDate(new Date(time)),
      deviceId: null,
      deviceName: 'Sample data',
      source: 'manual',
    });

  for (let t = start; t <= now; t += 15 * 60 * 1000) {
    const hour = new Date(t).getHours();
    const asleep = hour < 7 || hour >= 23;
    add('heart_rate', (asleep ? 55 : 72) + Math.round(Math.random() * 18), t);
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
    dayTotal += hour >= 7 && hour < 22 ? 200 + Math.round(Math.random() * 900) : 0;
    add('steps', dayTotal, t);
  }

  try {
    await batch.commit();
  } catch (error) {
    console.warn("Couldn't save sample data:", error);
  }
}

// Mock only in readings.ts (seeded device history). Real history comes from Firestore.
export function seedReadings(_readings: SensorReading[]) {}
