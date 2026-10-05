import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';
import * as constants from '../src/lib/ble/constants.ts';
import * as uuid from '../src/lib/ble/uuid.ts';
import * as parser from '../src/lib/ble/heartRateMeasurement.ts';
import * as deadlines from '../src/lib/asyncDeadline.ts';
import * as keys from '../src/lib/ble/deviceKey.ts';

function serviceFor({ heartRate = true, battery = null, platform = 'ios', connectHook } = {}) {
  const calls = [];
  const monitors = new Map();
  const drops = new Map();
  const connects = [];
  const cancelled = [];
  const manager = {
    connectToDevice: async (id, options) => { connects.push({ id, options }); await connectHook?.(id); },
    discoverAllServicesAndCharacteristicsForDevice: async () => {},
    servicesForDevice: async () => heartRate ? [{ uuid: '180d' }] : [],
    readCharacteristicForDevice: async () => { calls.push('battery'); if (battery === null) throw new Error('missing'); return { value: battery }; },
    monitorCharacteristicForDevice: (id, service, characteristic, callback) => { calls.push('monitor'); monitors.set(id, callback); return { remove() { monitors.delete(id); } }; },
    onDeviceDisconnected: (id, callback) => { drops.set(id, callback); return { remove() { drops.delete(id); } }; },
    cancelDeviceConnection: async (id) => { calls.push('disconnect'); cancelled.push(id); },
    cancelTransaction: async () => {},
  };
  const { BleService } = loadAdapter('../src/lib/ble/BleService.native.ts', {
    'react-native': { Platform: { OS: platform } },
    'react-native-ble-plx': { BleManager: class { constructor() { return manager; } }, BleError: class extends Error {}, BleErrorCode: {}, State: {} },
    './constants': { ...constants, RETRY_BASE_DELAY_MS: 1 }, './deviceKey': keys, './uuid': uuid, './heartRateMeasurement': parser, '../asyncDeadline': deadlines,
  });
  return { service: new BleService(), calls, monitors, drops, connects, cancelled };
}

test('missing optional services never stop HR monitoring or cause retries', async () => {
  const { service, calls } = serviceFor();
  assert.equal(await service.connect('one', 'Heart Rate'), true);
  assert.equal(service.getConnectionState().status, 'connected');
  assert.equal(service.getConnectionState().batteryLevel, null);
  assert.deepEqual(calls, ['monitor', 'battery']);
  await service.disconnect();
});

test('a device without heart rate stays connected with a clear status', async () => {
  const { service, calls } = serviceFor({ heartRate: false });
  assert.equal(await service.connect('one', 'Other device'), true);
  assert.match(service.getConnectionState().error, /doesn't provide heart rate/);
  assert.equal(service.getConnectionState().status, 'connected');
  assert.deepEqual(calls, ['battery']);
  await service.disconnect();
});


test('two devices stream independently and disconnect removes only the requested monitor', async () => {
  const { service, monitors, cancelled } = serviceFor();
  const readings = [];
  service.onHeartRate((bpm, id, name) => readings.push({ bpm, id, name }));
  await Promise.all([service.connect('one', 'First'), service.connect('two', 'Second')]);
  monitors.get('one')(null, { value: 'AEY=' });
  monitors.get('two')(null, { value: 'AGQ=' });
  assert.deepEqual(readings, [{ bpm: 70, id: 'ios:one', name: 'First' }, { bpm: 100, id: 'ios:two', name: 'Second' }]);
  const staleMonitor = monitors.get('one');
  await service.disconnect('ios:one');
  staleMonitor(null, { value: 'AGQ=' });
  monitors.get('two')(null, { value: 'AFo=' });
  assert.equal(readings.length, 3);
  assert.equal(readings[2].id, 'ios:two');
  assert.deepEqual(cancelled, ['one']);
  assert.equal(service.getConnections()['ios:two'].status, 'connected');
  await service.disconnectAll();
});

test('four simultaneous reservations reject a fifth without opening a native connection', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const { service, connects } = serviceFor({ connectHook: () => gate });
  const pending = ['one', 'two', 'three', 'four'].map((id) => service.connect(id, id));
  await assert.rejects(service.connect('five', 'Fifth'), /maximum of 4/);
  release();
  assert.deepEqual(await Promise.all(pending), [true, true, true, true]);
  assert.equal(connects.length, 4);
  await service.disconnectAll();
});

test('cancel during handshake prevents a late monitor and leaves another stream active', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const { service, monitors } = serviceFor({ connectHook: (id) => id === 'slow' ? gate : undefined });
  await service.connect('fast', 'Fast');
  const pending = service.connect('slow', 'Slow');
  await new Promise((resolve) => setTimeout(resolve, 0));
  await service.disconnect('slow');
  release();
  assert.equal(await pending, false);
  assert.equal(monitors.has('slow'), false);
  assert.equal(monitors.has('fast'), true);
  await service.disconnectAll();
});

test('unexpected drop reconnects only its device and Android alone requests MTU', async () => {
  for (const platform of ['ios', 'android']) {
    const { service, drops, connects, monitors } = serviceFor({ platform });
    await service.connect('one', 'First');
    await service.connect('two', 'Second');
    drops.get('one')(null);
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(connects.map((entry) => entry.id), ['one', 'two', 'one']);
    assert.equal(monitors.has('two'), true);
    assert.equal(connects[0].options.requestMTU, platform === 'android' ? 185 : undefined);
    await service.disconnectAll();
  }
});

test('three failed connection attempts never interrupt another device', async () => {
  const { service, connects, monitors } = serviceFor({ connectHook: (id) => { if (id === 'bad') throw new Error('unreachable'); } });
  await service.connect('good', 'Good');
  assert.equal(await service.connect('bad', 'Bad'), false);
  assert.equal(connects.filter((entry) => entry.id === 'bad').length, 3);
  assert.equal(monitors.has('good'), true);
  assert.equal(service.getConnections()['ios:bad'].status, 'disconnected');
  await service.disconnectAll();
});

test('logical keys round-trip native iOS UUIDs and Android MACs without re-prefixing', () => {
  for (const [platform, id] of [['ios', 'uuid-123'], ['android', 'AA:BB:CC:DD:EE:FF']]) {
    const key = keys.deviceKey(platform, id);
    assert.equal(keys.deviceKey(platform, key), key);
    assert.equal(keys.nativeDeviceId(key), id);
    assert.equal(keys.devicePlatform(key), platform);
  }
});
