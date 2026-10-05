import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';
import * as queues from '../src/lib/sensors/readingBatches.ts';
import * as keys from '../src/lib/ble/deviceKey.ts';
import * as deadlines from '../src/lib/asyncDeadline.ts';

const documents = loadAdapter('../src/lib/sensors/readingDocuments.ts', { '../ble/deviceKey': keys });
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('native readings preserve shared paths and native IDs, persist before upload and isolate users', async (t) => {
  let uid = 'one';
  let nextId = 0;
  const writes = [];
  const storage = new Map();
  const snapshots = [];
  const cleanups = [];
  t.after(() => cleanups.forEach((cleanup) => cleanup()));
  const adapter = loadAdapter('../src/lib/sensors/readings.native.ts', {
    '@react-native-async-storage/async-storage': { getItem: async (key) => storage.get(key) ?? null, setItem: async (key, value) => { storage.set(key, value); } },
    'react-native': { Platform: { OS: 'ios' }, AppState: { addEventListener: () => ({ remove() {} }) } },
    '@react-native-firebase/auth': { getAuth: () => ({ currentUser: { uid } }) },
    '@react-native-firebase/firestore': {
      getFirestore: () => ({}), collection: (_, ...parts) => ({ path: parts.join('/') }),
      doc: (ref, ...parts) => parts.length ? { path: parts.join('/') } : { path: `${ref.path}/id-${++nextId}`, id: `id-${nextId}` },
      query: (ref) => ref, where: () => {}, orderBy: () => {}, limit: () => {},
      Timestamp: { fromMillis: (ms) => ({ millis: ms, toMillis: () => ms }) },
      onSnapshot: (ref, onData) => { snapshots.push({ ref, onData }); onData({ docs: [], size: 0 }); return () => {}; },
      writeBatch: () => ({
        set: (ref, value) => { assert.ok(storage.has(`dss:reading-queue:v1:${uid}`)); writes.push({ path: ref.path, value }); },
        commit: async () => {},
      }),
    },
    '../asyncDeadline': deadlines, '../ble/deviceKey': keys, './readingBatches': queues, './readingDocuments': documents,
  });
  const fatal = [];
  const stopOne = adapter.startReadingSession(uid, (error) => fatal.push(error));
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
  assert.equal(seen.at(-1)[0].deviceId, 'ios:UUID');
  await adapter.addSensorReading('current-user', 'heart_rate', { value: 80, timestamp: new Date(2000), deviceName: 'Test data', source: 'test' });
  adapter.flushReadings(); await tick(); await tick();
  assert.equal(writes[2].value.source, 'test');
  assert.equal(writes[3].value.source, 'test');
  assert.equal(writes[3].value.deviceId, null);
  stopOne(); uid = 'two';
  const stopTwo = adapter.startReadingSession(uid, (error) => fatal.push(error));
  cleanups.push(stopTwo);
  await tick();
  snapshots[0].onData({ docs: [{ id: 'old', data: () => ({ value: 99, timestamp: 1 }) }], size: 1 });
  assert.equal(seen.at(-1).length, 0);
  assert.equal(fatal.length, 0);
  unsubscribe(); stopTwo(); await tick();
});
