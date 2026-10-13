import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';
import * as queues from '../src/lib/sensors/readingBatches.ts';
import * as keys from '../src/lib/ble/deviceKey.ts';
import * as metrics from '../src/lib/biometrics/metrics.ts';
import * as samples from '../src/lib/biometrics/sampleData.ts';
import * as deadlines from '../src/lib/asyncDeadline.ts';

const documents = loadAdapter('../src/lib/sensors/readingDocuments.ts', { '../ble/deviceKey': keys, '../biometrics/metrics': metrics });
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function setup(t, initialUid = 'one') {
  const state = { uid: initialUid, nextId: 0, writes: [], storage: new Map(), snapshots: [], cleanups: [] };
  t.after(() => state.cleanups.forEach((cleanup) => cleanup()));
  const adapter = loadAdapter('../src/lib/sensors/readings.native.ts', {
    '@react-native-async-storage/async-storage': { getItem: async (key) => state.storage.get(key) ?? null, setItem: async (key, value) => { state.storage.set(key, value); } },
    'react-native': { Platform: { OS: 'ios' }, AppState: { addEventListener: () => ({ remove() {} }) } },
    '@react-native-firebase/auth': { getAuth: () => ({ currentUser: { uid: state.uid } }) },
    '@react-native-firebase/firestore': {
      getFirestore: () => ({}), collection: (_, ...parts) => ({ path: parts.join('/') }),
      doc: (ref, ...parts) => parts.length ? { path: parts.join('/') } : { path: `${ref.path}/id-${++state.nextId}`, id: `id-${state.nextId}` },
      query: (ref) => ref, where: () => {}, orderBy: () => {}, limit: () => {},
      Timestamp: { fromMillis: (ms) => ({ millis: ms, toMillis: () => ms }) },
      onSnapshot: (ref, onData) => { state.snapshots.push({ ref, onData }); onData({ docs: [], size: 0 }); return () => {}; },
      writeBatch: () => ({
        set: (ref, value) => { assert.ok(state.storage.has(`dss:reading-queue:v1:${state.uid}`)); state.writes.push({ path: ref.path, value }); },
        commit: async () => {},
      }),
    },
    '../asyncDeadline': deadlines, '../ble/deviceKey': keys, '../biometrics/metrics': metrics, '../biometrics/sampleData': samples, './readingBatches': queues, './readingDocuments': documents,
  });
  return { adapter, state };
}

test('native readings preserve shared paths and native IDs, persist before upload and isolate users', async (t) => {
  const { adapter, state } = setup(t);
  const { writes, snapshots, cleanups } = state;
  const fatal = [];
  const stopOne = adapter.startReadingSession(state.uid, (error) => fatal.push(error));
  cleanups.push(stopOne);
  const seen = [];
  const unsubscribe = adapter.subscribeToReadingsSince('current-user', 'heart_rate', new Date(0), (rows) => seen.push(rows), (error) => fatal.push(error));
  cleanups.push(unsubscribe);
  await adapter.addSensorReading('current-user', 'heart_rate', { value: 70, timestamp: new Date(1000), deviceId: 'ios:UUID', deviceName: 'One', source: 'ble' });
  adapter.flushReadings(); await tick(); await tick();
  assert.equal(writes.length, 2);
  assert.match(writes[0].path, /^users\/one\/reading_batches\//);
  assert.equal(writes[0].value.deviceId, 'UUID');
  assert.equal(writes[0].value.platform, 'ios');
  assert.equal(writes[0].value.samples[0].t.millis, 1000);
  assert.match(writes[1].path, /^users\/one\/sensor_readings\/heart_rate\/readings\//);
  assert.equal(writes[1].value.source, 'ble');
  await wait(1100); // history subscribers are told at most once a second
  assert.equal(seen.at(-1)[0].deviceId, 'ios:UUID');
  await adapter.addSensorReading('current-user', 'heart_rate', { value: 80, timestamp: new Date(2000), deviceName: 'Test data', source: 'test' });
  adapter.flushReadings(); await tick(); await tick();
  assert.equal(writes[2].value.source, 'test');
  assert.equal(writes[3].value.source, 'test');
  assert.equal(writes[3].value.deviceId, null);
  stopOne(); state.uid = 'two';
  const stopTwo = adapter.startReadingSession(state.uid, (error) => fatal.push(error));
  cleanups.push(stopTwo);
  await tick();
  snapshots[0].onData({ docs: [{ id: 'old', data: () => ({ value: 99, timestamp: 1 }) }], size: 1 });
  assert.equal(seen.at(-1).length, 0);
  assert.equal(fatal.length, 0);
  unsubscribe(); stopTwo(); await tick();
});

test('the newest value updates at once and only when it changes; history at most once a second, in time order', async (t) => {
  const { adapter, state } = setup(t);
  const stop = adapter.startReadingSession(state.uid, () => {});
  state.cleanups.push(stop);
  await tick(); await tick();
  const latest = [];
  const history = [];
  state.cleanups.push(adapter.subscribeToLatestReading('current-user', 'heart_rate', (reading) => latest.push(reading?.value ?? null), () => {}));
  state.cleanups.push(adapter.subscribeToReadingsSince('current-user', 'heart_rate', new Date(1500), (rows) => history.push(Array.from(rows, (r) => r.value)), () => {}));
  const before = history.length;
  for (const [value, at] of [[70, 2000], [71, 3000], [69, 1000], [72, 2500]]) {
    await adapter.addSensorReading('current-user', 'heart_rate', { value, timestamp: new Date(at), deviceId: 'ios:A', deviceName: 'A', source: 'ble' });
  }
  // The newest value arrives straight away, and only when it changes: 69 and 72 arrived late
  // (older timestamps), so the newest stayed 71 and nothing more was sent.
  assert.deepEqual(latest, [null, 70, 71]);
  assert.ok(history.length - before <= 1, 'history is coalesced');
  await wait(1100);
  // Sorted by time, and the reading before the window start (1000) is left out
  assert.deepEqual(history.at(-1), [70, 72, 71]);
  stop(); await tick();
});

test('reaching a display limit shows a note and keeps the data', async (t) => {
  const { adapter, state } = setup(t);
  const errors = [];
  const stop = adapter.startReadingSession(state.uid, (error) => errors.push(error));
  state.cleanups.push(stop);
  await tick(); await tick();
  const notices = [];
  const rows = [];
  state.cleanups.push(adapter.subscribeToReadingNotice((notice) => notices.push(notice)));
  state.cleanups.push(adapter.subscribeToReadingsSince('current-user', 'heart_rate', new Date(0), (list) => rows.push(list.length), (error) => errors.push(error)));
  assert.deepEqual(notices, [null]);
  const batches = state.snapshots.find((snapshot) => snapshot.ref.path === 'users/one/reading_batches');
  const batch = { id: 'b1', data: () => ({ type: 'heart_rate', deviceId: 'UUID', platform: 'ios', source: 'ble', samples: [{ t: 1000, v: 70 }, { t: 2000, v: 71 }] }) };
  batches.onData({ docs: [batch], size: 2000 });
  assert.equal(notices.at(-1), adapter.DISPLAY_LIMIT_NOTICE);
  await wait(1100);
  assert.equal(rows.at(-1), 2);
  assert.equal(errors.length, 0);
  // Back under the limit: the note goes away
  batches.onData({ docs: [batch], size: 1 });
  assert.equal(notices.at(-1), null);
  stop(); await tick();
});

test('signed in but no session yet: screens keep loading briefly, then show empty', async (t) => {
  const { adapter, state } = setup(t);
  const latest = [];
  state.cleanups.push(adapter.subscribeToLatestReading('current-user', 'steps', (reading) => latest.push(reading), () => {}));
  // No answer straight away: "0 steps" must not flash before the session starts
  assert.equal(latest.length, 0);
  await wait(3200);
  assert.deepEqual(latest, [null]);
});
