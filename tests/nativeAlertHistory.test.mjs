import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('alert history persists, reloads, and isolates account writes', async () => {
  const storage = new Map();
  const auth = { currentUser: { uid: 'one' } };
  const load = () => loadAdapter('../src/lib/alerts/alertHistory.native.ts', {
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, value) => { storage.set(key, value); },
    },
    '@react-native-firebase/auth': { getAuth: () => auth },
  });
  const first = load();
  const seenOne = [];
  const stopOne = first.subscribeToAlerts('one', (alerts) => seenOne.push(alerts), (error) => { throw error; });
  await tick();
  await first.addAlert('one', { type: 'HR_HIGH', value: 130, message: 'A', timestamp: 100, deviceId: 'ios:A', deviceName: 'A' });
  assert.equal(seenOne.at(-1)[0].deviceName, 'A');
  stopOne();
  auth.currentUser = { uid: 'two' };
  await assert.rejects(first.addAlert('one', { type: 'HR_LOW', value: 40, message: 'B', timestamp: 200 }));
  const seenTwo = [];
  const stopTwo = first.subscribeToAlerts('two', (alerts) => seenTwo.push(alerts), (error) => { throw error; });
  await tick();
  assert.equal(seenTwo.at(-1).length, 0);
  stopTwo();
  auth.currentUser = { uid: 'one' };
  const second = load();
  const reloaded = [];
  const stopReload = second.subscribeToAlerts('one', (alerts) => reloaded.push(alerts), (error) => { throw error; });
  await tick();
  assert.equal(reloaded.at(-1).length, 1);
  await second.clearAlerts('one');
  assert.deepEqual(JSON.parse(storage.get('dss:alert-history:v1:one')), []);
  stopReload();
});
