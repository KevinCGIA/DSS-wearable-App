import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';
import * as constants from '../src/lib/ble/constants.ts';
import * as uuid from '../src/lib/ble/uuid.ts';
import * as parser from '../src/lib/ble/heartRateMeasurement.ts';
import * as deadlines from '../src/lib/asyncDeadline.ts';

function serviceFor({ heartRate = true, battery = null } = {}) {
  const calls = [];
  const manager = {
    connectToDevice: async () => {},
    discoverAllServicesAndCharacteristicsForDevice: async () => {},
    servicesForDevice: async () => heartRate ? [{ uuid: '180d' }] : [],
    readCharacteristicForDevice: async () => { calls.push('battery'); if (battery === null) throw new Error('missing'); return { value: battery }; },
    monitorCharacteristicForDevice: () => { calls.push('monitor'); return { remove() {} }; },
    onDeviceDisconnected: () => ({ remove() {} }),
    cancelDeviceConnection: async () => { calls.push('disconnect'); },
    cancelTransaction: async () => {},
  };
  const { BleService } = loadAdapter('../src/lib/ble/BleService.native.ts', {
    'react-native': { Platform: { OS: 'ios' } },
    'react-native-ble-plx': { BleManager: class { constructor() { return manager; } }, BleError: class extends Error {}, BleErrorCode: {}, State: {} },
    './constants': constants, './uuid': uuid, './heartRateMeasurement': parser, '../asyncDeadline': deadlines,
  });
  return { service: new BleService(), calls };
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
