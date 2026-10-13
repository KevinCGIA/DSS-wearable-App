import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getFirestore, limit, onSnapshot, orderBy, query, Timestamp, where, writeBatch, type Query, type QuerySnapshot } from '@react-native-firebase/firestore';
import type { ReadingSource, SensorReading, SensorType } from '@/data/types';
import { subscribeWithDeadline, withDeadline } from '../asyncDeadline';
import { devicePlatform, nativeDeviceId } from '../ble/deviceKey';
import { ReadingBatchQueue } from './readingBatches';
import { METRIC_BY_ID, metricForType, SENSOR_TYPES, STORED_UNITS } from '../biometrics/metrics';
import { sampleVitals } from '../biometrics/sampleData';
import { batchFromDocument, batchReadings, legacyReading, mergeReadings } from './readingDocuments';

type Input = { value: number; timestamp?: Date; deviceId?: string | null; deviceName?: string | null; source: ReadingSource };
type Session = {
  uid: string; queue: ReadingBatchQueue; ready: Promise<void>; active: boolean;
  live: Map<string, SensorReading>; remote: Map<string, SensorReading[]>;
  error: Error | null; loaded: boolean; restored: boolean; fatalError: boolean; fatal: (error: Error) => void;
  // listeners at their display limit
  limited: Set<string>;
};
let current: Session | null = null;
// loaded readings by type, oldest first
let byType = new Map<SensorType, SensorReading[]>();
// latest-value subscribers hear every change; history subscribers at most once a second
const latestListeners = new Set<() => void>();
const historyListeners = new Set<() => void>();
const noticeListeners = new Set<(notice: string | null) => void>();
const liveListeners = new Set<(reading: SensorReading) => void>();
const closing = new Map<string, Promise<void>>();
// screens show 7 days; the extra day is a baseline for running totals
const HISTORY_DAYS = 8;
const BATCH_DISPLAY_LIMIT = 2000;
// Firestore rejects listener limits above 10,000 (invalid-argument)
const LEGACY_DISPLAY_LIMIT = 10000;
const HISTORY_EMIT_MS = 1000;
export const DISPLAY_LIMIT_NOTICE = 'Showing your most recent readings. Older readings are saved, but there are too many to show here.';

// during a bulk add, screens refresh once at the end
let bulk = false;
let lastHistoryEmit = 0;
let historyTimer: ReturnType<typeof setTimeout> | null = null;

const readingsOf = (type: SensorType) => byType.get(type) ?? [];
// production hides test data
const visible = (reading: SensorReading) => __DEV__ || reading.source === 'ble';

// First index whose reading is at or after `time`
function indexAt(list: SensorReading[], time: number) {
  let low = 0;
  let high = list.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (list[middle].timestamp.getTime() < time) low = middle + 1; else high = middle;
  }
  return low;
}

// full merge, after a Firestore snapshot
function rebuild() {
  byType = new Map();
  if (!current) return;
  for (const reading of mergeReadings([...current.remote.values()].flat().concat([...current.live.values()]))) {
    if (!visible(reading)) continue;
    const list = byType.get(reading.type);
    if (list) list.push(reading); else byType.set(reading.type, [reading]);
  }
}

// a live reading goes straight into place
function insert(reading: SensorReading) {
  if (!visible(reading)) return;
  const list = byType.get(reading.type);
  if (!list) { byType.set(reading.type, [reading]); return; }
  const time = reading.timestamp.getTime();
  if (!list.length || list[list.length - 1].timestamp.getTime() <= time) list.push(reading);
  else list.splice(indexAt(list, time + 1), 0, reading);
}

function notifyHistory(now = false) {
  if (historyTimer && now) { clearTimeout(historyTimer); historyTimer = null; }
  if (historyTimer) return;
  const wait = now ? 0 : HISTORY_EMIT_MS - (Date.now() - lastHistoryEmit);
  if (wait <= 0) { lastHistoryEmit = Date.now(); historyListeners.forEach((listener) => listener()); return; }
  historyTimer = setTimeout(() => {
    historyTimer = null; lastHistoryEmit = Date.now();
    historyListeners.forEach((listener) => listener());
  }, wait);
}

// reading: one new live reading; omitted when saved documents or the session changed
function emit(reading?: SensorReading, now = false) {
  if (reading && current) insert(reading); else rebuild();
  if (bulk) return;
  latestListeners.forEach((listener) => listener());
  notifyHistory(now);
}

const noticeOf = (session: Session | null) => (session?.limited.size ? DISPLAY_LIMIT_NOTICE : null);
function setLimited(session: Session, key: string, limited: boolean) {
  if (limited === session.limited.has(key)) return;
  if (limited) session.limited.add(key); else session.limited.delete(key);
  if (current === session) noticeListeners.forEach((listener) => listener(noticeOf(session)));
}

function report(session: Session, error: Error, fatal = false) {
  if (!session.active || current !== session) return;
  const denied = String((error as Error & { code?: string }).code).includes('permission-denied');
  session.error = denied ? new Error('The server refused to save readings (permission denied), so recording has stopped. The Firestore security rules need to allow reading_batches.') : error;
  session.loaded = true;
  if (fatal || denied) {
    session.fatalError = true;
    if (session.restored) void session.queue.stop().catch(() => undefined);
    session.fatal(session.error);
  }
  emit(undefined, true);
}

export function startReadingSession(uid: string, onFatal: (error: Error) => void): () => void {
  const db = getFirestore();
  const storageKey = `dss:reading-queue:v1:${uid}`;
  const stops: (() => void)[] = [];
  const session: Session = {
    uid, active: true, live: new Map(), remote: new Map(), error: null, loaded: false, restored: false, fatalError: false, fatal: onFatal,
    limited: new Set(),
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
          value: batch.legacy.v, unit: STORED_UNITS[batch.type],
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
      (snapshot) => {
        if (!session.active || current !== session) return;
        if (!session.fatalError) session.error = null;
        receive(snapshot);
        // the first snapshot ends loading immediately
        const first = !session.loaded;
        session.loaded = true;
        emit(undefined, first);
      },
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
    for (const type of SENSOR_TYPES) {
      watch(query(collection(db, 'users', uid, 'sensor_readings', type, 'readings'), where('timestamp', '>=', since), orderBy('timestamp', 'desc'), limit(LEGACY_DISPLAY_LIMIT)), (snapshot) => {
        session.remote.set(type, snapshot.docs.map((d) => legacyReading(`legacy:${type}:${d.id}`, type, d.data())).filter((r): r is SensorReading => r !== null));
        setLimited(session, `legacy:${type}`, snapshot.size >= LEGACY_DISPLAY_LIMIT);
      });
    }
    watch(query(collection(db, 'users', uid, 'reading_batches'), where('endAt', '>=', since), orderBy('endAt', 'desc'), limit(BATCH_DISPLAY_LIMIT)), (snapshot) => {
      const readings: SensorReading[] = [];
      for (const d of snapshot.docs) {
        const batch = batchFromDocument(d.id, d.data());
        if (batch) readings.push(...batchReadings(batch));
      }
      session.remote.set('batches', readings);
      setLimited(session, 'batches', snapshot.size >= BATCH_DISPLAY_LIMIT);
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
    if (current === session) {
      current = null;
      emit(undefined, true);
      noticeListeners.forEach((listener) => listener(null));
    }
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

// Wait for saved history before answering, unless live readings exist. Just after sign-in
// the session hasn't started; a short grace period avoids flashing an empty Dashboard.
const SESSION_GRACE_MS = 3000;
let noSessionSince: number | null = null;
let graceTimer: ReturnType<typeof setTimeout> | null = null;
function waiting() {
  if (current) { noSessionSince = null; return !current.loaded && !byType.size; }
  if (!getAuth().currentUser) return false;
  noSessionSince ??= Date.now();
  const left = SESSION_GRACE_MS - (Date.now() - noSessionSince);
  if (left <= 0) return false;
  graceTimer ??= setTimeout(() => {
    graceTimer = null;
    latestListeners.forEach((listener) => listener());
    historyListeners.forEach((listener) => listener());
  }, left);
  return true;
}

// subscribers are called only when their own data changed
export function subscribeToLatestReading(_uid: string, type: SensorType, onData: (reading: SensorReading | null) => void, onError: (error: Error) => void) {
  let sent: SensorReading | null | undefined;
  const listener = () => {
    if (current?.error) { sent = undefined; onError(current.error); return; }
    if (waiting()) return;
    const list = readingsOf(type);
    const latest = list[list.length - 1] ?? null;
    if (latest === sent) return;
    sent = latest;
    onData(latest);
  };
  latestListeners.add(listener); listener();
  return () => { latestListeners.delete(listener); };
}
export function subscribeToReadingsSince(_uid: string, type: SensorType, since: Date, onData: (readings: SensorReading[]) => void, onError: (error: Error) => void) {
  let sent: { count: number; first: SensorReading | undefined; last: SensorReading | undefined } | null = null;
  const listener = () => {
    if (current?.error) { sent = null; onError(current.error); return; }
    if (waiting()) return;
    const list = readingsOf(type);
    const start = indexAt(list, since.getTime());
    const next = { count: list.length - start, first: list[start], last: list[list.length - 1] };
    if (sent && sent.count === next.count && sent.first === next.first && sent.last === next.last) return;
    sent = next;
    onData(list.slice(start));
  };
  historyListeners.add(listener); listener();
  return () => { historyListeners.delete(listener); };
}
// set when more is saved than the screens load
export function subscribeToReadingNotice(listener: (notice: string | null) => void) {
  noticeListeners.add(listener); listener(noticeOf(current));
  return () => { noticeListeners.delete(listener); };
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
    // spot devices resend stored records on every connection; keep each once
    if (input.timestamp && METRIC_BY_ID[metricForType(type)].kind === 'spot' && source === 'ble') {
      const time = timestamp.getTime();
      const list = readingsOf(type);
      for (let i = indexAt(list, time); i < list.length && list[i].timestamp.getTime() === time; i += 1) {
        if (list[i].deviceId === deviceId) return;
      }
    }
    const result = session.queue.add({
      deviceId: nativeDeviceId(deviceId), deviceName: input.deviceName ?? null,
      platform: source === 'ble' ? devicePlatform(deviceId) : Platform.OS === 'ios' ? 'ios' : 'android', type, source,
    }, { t: timestamp.getTime(), v: input.value });
    const reading: SensorReading = {
      id: `${result.id}:${result.index}`, type, value: input.value, timestamp,
      unit: STORED_UNITS[type], deviceId: source === 'ble' ? deviceId : null,
      deviceName: input.deviceName ?? null, source, resolution: 'sample',
    };
    session.live.set(reading.id, reading);
    // Firestore owns durable history. Bound the additional live overlay.
    if (session.live.size > 100000) session.live.delete(session.live.keys().next().value!);
    liveListeners.forEach((listener) => listener(reading));
    emit(reading);
  } catch (error) { report(session, error as Error, true); }
}

export async function addSampleDay(uid: string): Promise<void> {
  if (!__DEV__) return;
  const end = Date.now();
  bulk = true;
  try {
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
    for (const sample of sampleVitals(end)) {
      await addSensorReading(uid, sample.type, { value: sample.value, timestamp: new Date(sample.t), source: 'test', deviceName: 'Test data' });
    }
  } finally {
    bulk = false;
    emit();
  }
  flushReadings();
}

export function seedReadings(readings: SensorReading[]) {
  if (__DEV__ && current) { for (const reading of readings) current.live.set(reading.id, reading); emit(); }
}
