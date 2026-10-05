import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';

const normalized = (value) => JSON.parse(JSON.stringify(value));

test('native adapter uses users/{uid}/settings/alerts, merge writes and server timestamps', async () => {
  const calls = [];
  let captured;
  const sentinel = { server: true };
  const { subscribeToAlertThresholds, saveAlertThresholds, getAlertThresholdsUid } = loadAdapter(
    '../src/lib/alerts/thresholds.native.ts',
    {
      '@react-native-firebase/auth': { getAuth: () => ({ currentUser: { uid: 'user-1' } }) },
      '@react-native-firebase/firestore': {
        getFirestore: () => ({}),
        doc: (_, ...parts) => parts.join('/'),
        onSnapshot: (path, next, error) => {
          calls.push(['subscribe', path]);
          captured = { next, error };
          return () => calls.push(['unsubscribe']);
        },
        setDoc: async (path, data, options) => calls.push(['write', path, data, options]),
        serverTimestamp: () => sentinel,
      },
      './nativeThresholdStore': {
        createNativeThresholdStore: (deps) => ({
          getUid: deps.currentUid,
          subscribe: (uid, next, error) => deps.subscribeDocument(uid, next, error),
          save: (uid, value) => deps.writeDocument(uid, { ...value, updatedAt: deps.serverTimestamp() }),
        }),
      },
      './thresholdsCore': {},
    },
  );
  assert.equal(getAlertThresholdsUid(), 'user-1');
  const unsubscribe = subscribeToAlertThresholds('user-1', () => {}, () => {});
  assert.deepEqual(calls[0], ['subscribe', 'users/user-1/settings/alerts']);
  captured.next({ data: () => ({ enabled: true, hrMin: 50, hrMax: 120 }) });
  await saveAlertThresholds('user-1', { enabled: false, hrMin: 45, hrMax: 150 });
  assert.deepEqual(normalized(calls[1]), [
    'write', 'users/user-1/settings/alerts',
    { enabled: false, hrMin: 45, hrMax: 150, updatedAt: sentinel },
    { merge: true },
  ]);
  unsubscribe();
  assert.deepEqual(normalized(calls[2]), ['unsubscribe']);
});
