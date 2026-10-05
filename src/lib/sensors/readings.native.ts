import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getFirestore, limit, onSnapshot, orderBy, query, Timestamp, where, writeBatch, type Query, type QuerySnapshot } from '@react-native-firebase/firestore';
import type { ReadingSource, SensorReading, SensorType } from '@/data/types';
import { subscribeWithDeadline, withDeadline } from '../asyncDeadline';
import { devicePlatform, nativeDeviceId } from '../ble/deviceKey';
import { ReadingBatchQueue, type ReadingBatch } from './readingBatches';
import { batchReadings, legacyReading, mergeReadings, timestampMs } from './readingDocuments';

type Input = { value: number; timestamp?: Date; deviceId?: string | null; deviceName?: string | null; source: ReadingSource };
type Session = {
  uid: string; queue: ReadingBatchQueue; ready: Promise<void>; active: boolean;
  live: Map<string, SensorReading>; remote: Map<string, SensorReading[]>;
  error: Error | null; loaded: boolean; restored: boolean; fatalError: boolean; fatal: (error: Error) => void;
};
let current: Session | null = null;
let cached: SensorReading[] = [];
const listeners = new Set<() => void>();
const liveListeners = new Set<(reading: SensorReading) => void>();
const closing = new Map<string, Promise<void>>();
const HISTORY_DAYS = 30;
const BATCH_DISPLAY_LIMIT = 2000;
const LEGACY_DISPLAY_LIMIT = 20000;

function emit() {
  cached = current ? mergeReadings([...current.remote.values()].flat().concat([...current.live.values()])) : [];
  listeners.forEach((listener) => listener());
}

function report(session: Session, error: Error, fatal = false) {
  if (!session.active || current !== session) return;
  const denied = String((error as Error & { code?: string }).code).includes('permission-denied');
  session.error = denied ? new Error('Firestore denied saved readings. Kevin/Jared must allow reading_batches; recording stopped.') : error;
  session.loaded = true;
  if (fatal || denied) {
    session.fatalError = true;
    if (session.restored) void session.queue.stop().catch(() => undefined);
    session.fatal(session.error);
  }
  emit();
}

export function startReadingSession(uid: string, onFatal: (error: Error) => void): () => void {
  const db = getFirestore();
  const storageKey = `dss:reading-queue:v1:${uid}`;
  const stops: (() => void)[] = [];
  const session: Session = {
    uid, active: true, live: new Map(), remote: new Map(), error: null, loaded: false, restored: false, fatalError: false, fatal: onFatal,
    ready: Promise.resolve(),
    queue: new ReadingBatchQueue({
      id: () => doc(collection(db, 'users', uid, 'reading_batches')).id,
      save: (json) => AsyncStorage.setItem(storageKey, json),
      async write(batch) {
        if (getAuth().currentUser?.uid !== uid) throw new Error('Reading upload paused because the account changed.');
        const transaction = writeBatch(db);
        const samples = batch.samples.map((s) => ({ t: Timestamp.fromMillis(s.t), v: s.v }));
        transaction.set(doc(db, 'users', uid, 'reading_batches', batch.id), {
          deviceId: batch.deviceId, deviceName: batch.deviceName, platform: batch.platform,
          type: batch.type, source: batch.source,
          startAt: samples[0].t, endAt: samples[samples.length - 1].t, samples,
        });
        if (batch.legacy) transaction.set(doc(db, 'users', uid, 'sensor_readings', batch.type, 'readings', batch.id), {
          value: batch.legacy.v, unit: batch.type === 'heart_rate' ? 'bpm' : 'steps',
          timestamp: Timestamp.fromMillis(batch.legacy.t),
          deviceId: batch.source === 'test' ? null : batch.deviceId, deviceName: batch.deviceName,
          source: batch.source, platform: batch.platform,
        });
        await transaction.commit();
      },
      onError: (error) => report(session, error),
    }),
  };
  current = session;
  emit();
  const watch = (reference: Query, receive: (snapshot: QuerySnapshot) => void) => {
    stops.push(subscribeWithDeadline<QuerySnapshot>(
      (onData, onError) => onSnapshot(reference, onData, onError),
      (snapshot) => { if (session.active && current === session) { if (!session.fatalError) session.error = null; receive(snapshot); session.loaded = true; emit(); } },
      (error) => report(session, error),
    ));
  };
  session.ready = (async () => {
    await closing.get(uid);
    session.queue.restore(await withDeadline(AsyncStorage.getItem(storageKey)));
    session.restored = true;
    if (!session.active) return;
    for (const batch of session.queue.batches()) for (const reading of batchReadings(batch)) session.live.set(reading.id, reading);
    emit();
    await session.queue.flush();
    if (!session.active) return;
    const since = Timestamp.fromMillis(Date.now() - HISTORY_DAYS * 86400000);
    for (const type of ['heart_rate', 'steps'] as const) {
      watch(query(collection(db, 'users', uid, 'sensor_readings', type, 'readings'), where('timestamp', '>=', since), orderBy('timestamp', 'desc'), limit(LEGACY_DISPLAY_LIMIT)), (snapshot) => {
        session.remote.set(type, snapshot.docs.map((d) => legacyReading(`legacy:${type}:${d.id}`, type, d.data())).filter((r): r is SensorReading => r !== null));
        if (snapshot.size === LEGACY_DISPLAY_LIMIT) report(session, new Error('The saved-reading display limit was reached. Older readings remain in Firestore.'));
      });
    }
    watch(query(collection(db, 'users', uid, 'reading_batches'), where('endAt', '>=', since), orderBy('endAt', 'desc'), limit(BATCH_DISPLAY_LIMIT)), (snapshot) => {
      const readings: SensorReading[] = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        if (!Array.isArray(data.samples) || !['heart_rate', 'steps'].includes(data.type) || typeof data.deviceId !== 'string') continue;
        const batch: ReadingBatch = {
          id: d.id, deviceId: data.deviceId, deviceName: data.deviceName ?? null,
          platform: data.platform === 'ios' ? 'ios' : 'android', type: data.type,
          source: data.source === 'test' ? 'test' : 'ble', legacy: null,
          samples: data.samples.flatMap((sample: { t: unknown; v: unknown }) => {
            const t = timestampMs(sample.t);
            return t !== null && typeof sample.v === 'number' && Number.isFinite(sample.v) ? [{ t, v: sample.v }] : [];
          }),
        };
        readings.push(...batchReadings(batch));
      }
      session.remote.set('batches', readings);
      if (snapshot.size === BATCH_DISPLAY_LIMIT) report(session, new Error('The full-resolution history display limit was reached. Older batches remain in Firestore.'));
    });
  })().catch((error) => { report(session, error as Error, true); throw error; });
  void session.ready.catch(() => undefined);
  const flush = () => { void session.ready.then(() => session.queue.flush()).catch((error) => report(session, error, true)); };
  const timer = setInterval(flush, 60000);
  const checkpoint = setInterval(() => { void session.ready.then(() => session.queue.checkpoint()).catch((error) => report(session, error, true)); }, 5000);
  const appState = AppState.addEventListener('change', (state) => { if (state !== 'active') flush(); });
  return () => {
    session.active = false;
    session.queue.pause();
    clearInterval(timer); clearInterval(checkpoint); appState.remove(); stops.forEach((stop) => stop());
    // Persist under the captured owner, even after auth changes. No new upload starts.
    const closed = session.ready.then(() => session.queue.stop()).catch(() => undefined);
    closing.set(uid, closed);
    if (current === session) { current = null; emit(); }
  };
}

export function clearReadings() { if (current) current.live.clear(); emit(); }
export function getReadingsUid() { return getAuth().currentUser?.uid ?? null; }
export function onLiveReading(listener: (reading: SensorReading) => void) {
  liveListeners.add(listener); return () => { liveListeners.delete(listener); };
}
export function flushReadings(deviceId?: string) {
  const session = current;
  if (session) void session.ready.then(() => session.queue.flush(deviceId ? nativeDeviceId(deviceId) : undefined)).catch((error) => report(session, error, true));
}

function subscribe(type: SensorType, since: number, onData: (readings: SensorReading[]) => void, onError: (error: Error) => void) {
  const listener = () => {
    if (current?.error) { onError(current.error); return; }
    if (current && !current.loaded && !cached.length) return;
    onData(cached.filter((r) => r.type === type && r.timestamp.getTime() >= since && (__DEV__ || r.source === 'ble')));
  };
  listeners.add(listener); listener();
  return () => { listeners.delete(listener); };
}
export function subscribeToLatestReading(_uid: string, type: SensorType, onData: (reading: SensorReading | null) => void, onError: (error: Error) => void) {
  return subscribe(type, 0, (readings) => onData(readings[readings.length - 1] ?? null), onError);
}
export function subscribeToReadingsSince(_uid: string, type: SensorType, since: Date, onData: (readings: SensorReading[]) => void, onError: (error: Error) => void) {
  return subscribe(type, since.getTime(), onData, onError);
}

export async function addSensorReading(_uid: string, type: SensorType, input: Input): Promise<void> {
  const session = current;
  if (!session || (!__DEV__ && input.source !== 'ble')) return;
  try {
    await session.ready;
    if (!session.active || getAuth().currentUser?.uid !== session.uid) return;
    const source = input.source === 'ble' ? 'ble' : 'test';
    const timestamp = input.timestamp ?? new Date();
    const deviceId = input.deviceId ?? 'test-data';
    const result = session.queue.add({
      deviceId: nativeDeviceId(deviceId), deviceName: input.deviceName ?? null,
      platform: source === 'ble' ? devicePlatform(deviceId) : Platform.OS === 'ios' ? 'ios' : 'android', type, source,
    }, { t: timestamp.getTime(), v: input.value });
    const reading: SensorReading = {
      id: `${result.id}:${result.index}`, type, value: input.value, timestamp,
      unit: type === 'heart_rate' ? 'bpm' : 'steps', deviceId: source === 'ble' ? deviceId : null,
      deviceName: input.deviceName ?? null, source, resolution: 'sample',
    };
    session.live.set(reading.id, reading);
    // Firestore owns durable history. Bound the additional live overlay.
    if (session.live.size > 100000) session.live.delete(session.live.keys().next().value!);
    liveListeners.forEach((listener) => listener(reading));
    emit();
  } catch (error) { report(session, error as Error, true); }
}

export async function addSampleDay(uid: string): Promise<void> {
  if (!__DEV__) return;
  const end = Date.now();
  for (let t = end - 86400000; t <= end; t += 15 * 60000) {
    await addSensorReading(uid, 'heart_rate', { value: 60 + Math.floor(Math.random() * 30), timestamp: new Date(t), source: 'test', deviceName: 'Test data' });
  }
  let total = 0;
  let day = '';
  for (let t = end - 86400000; t <= end; t += 3600000) {
    const nextDay = new Date(t).toDateString();
    if (nextDay !== day) { day = nextDay; total = 0; }
    total += Math.floor(Math.random() * 700);
    await addSensorReading(uid, 'steps', { value: total, timestamp: new Date(t), source: 'test', deviceName: 'Test data' });
  }
  flushReadings();
}

export function seedReadings(readings: SensorReading[]) {
  if (__DEV__ && current) { for (const reading of readings) current.live.set(reading.id, reading); emit(); }
}
