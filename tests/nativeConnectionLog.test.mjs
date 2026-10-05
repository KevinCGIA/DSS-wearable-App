import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';
import * as core from '../src/lib/devices/connectionLogCore.ts';
import * as deadlines from '../src/lib/asyncDeadline.ts';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('local connection history survives relaunch, closes offline gaps and stays per user', async (t) => {
  const storage = new Map();
  const errors = [];
  const cleanups = [];
  t.after(() => cleanups.forEach((stop) => stop()));
  storage.set('dss:connection-log:v1:one', JSON.stringify({
    foreground: true, updatedAt: Date.now() - 30000,
    events: [{ id: 'old', type: 'connected', deviceId: 'ios:A', timestamp: Date.now() - 40000 }],
  }));
  const app = { currentState: 'active', addEventListener: () => ({ remove() {} }) };
  const log = loadAdapter('../src/lib/devices/connectionLog.native.ts', {
    react: { useEffect() {}, useState: () => [[], () => {}] },
    'react-native': { AppState: app },
    '@react-native-async-storage/async-storage': { getItem: async (key) => storage.get(key) ?? null, setItem: async (key, value) => { storage.set(key, value); } },
    './connectionLogCore': core, '../asyncDeadline': deadlines,
  });
  const seen = [];
  const stopObserver = log.subscribeToConnectionLog((events) => seen.push(events));
  cleanups.push(stopObserver);
  const stopOne = log.startConnectionLog('one', (error) => errors.push(error));
  cleanups.push(stopOne);
  await tick(); await tick();
  assert.deepEqual(Array.from(seen.at(-1).slice(-2), (event) => event.type), ['app_background', 'app_foreground']);
  log.logConnectionEvent({ type: 'disconnected', deviceId: 'ios:A', reason: 'unexpected' });
  await tick();
  stopOne(); await tick();
  const saved = JSON.parse(storage.get('dss:connection-log:v1:one'));
  assert.ok(saved.events.some((event) => event.reason === 'unexpected'));
  const stopTwo = log.startConnectionLog('two', (error) => errors.push(error));
  cleanups.push(stopTwo);
  await tick();
  assert.equal(seen.at(-1).some((event) => event.deviceId === 'ios:A'), false);
  assert.equal(errors.length, 0);
});
