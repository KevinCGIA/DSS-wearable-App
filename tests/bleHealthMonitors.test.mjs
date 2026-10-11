import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';
import * as constants from '../src/lib/ble/constants.ts';
import * as uuid from '../src/lib/ble/uuid.ts';
import * as parser from '../src/lib/ble/heartRateMeasurement.ts';
import * as deadlines from '../src/lib/asyncDeadline.ts';
import * as keys from '../src/lib/ble/deviceKey.ts';
import * as decoders from '../src/lib/biometrics/decoders.ts';
import * as metrics from '../src/lib/biometrics/metrics.ts';

const b64 = (bytes) => Buffer.from(bytes).toString('base64');
const short = (full) => full.slice(4, 8);

function serviceWith(serviceUuids) {
  const monitors = new Map();
  const manager = {
    connectToDevice: async () => {},
    discoverAllServicesAndCharacteristicsForDevice: async () => {},
    servicesForDevice: async () => serviceUuids.map((u) => ({ uuid: u })),
    readCharacteristicForDevice: async () => { throw new Error('not present'); },
    monitorCharacteristicForDevice: (id, service, characteristic, callback) => {
      monitors.set(short(characteristic), callback);
      return { remove() { monitors.delete(short(characteristic)); } };
    },
    onDeviceDisconnected: () => ({ remove() {} }),
    cancelDeviceConnection: async () => {},
    cancelTransaction: async () => {},
  };
  const { BleService } = loadAdapter('../src/lib/ble/BleService.native.ts', {
    'react-native': { Platform: { OS: 'android' } },
    'react-native-ble-plx': { BleManager: class { constructor() { return manager; } }, BleError: class extends Error {}, BleErrorCode: {}, State: {} },
    './constants': constants, './deviceKey': keys, './uuid': uuid, './heartRateMeasurement': parser, '../asyncDeadline': deadlines,
    '../biometrics/decoders': decoders, '../biometrics/metrics': metrics,
  });
  return { service: new BleService(), monitors };
}

test('a multi-sensor device reports every measure and routes each decoded value', async () => {
  const { service, monitors } = serviceWith(['180d', '1809', '1810']);
  const heartRates = [];
  const samples = [];
  service.onHeartRate((bpm, id) => heartRates.push({ bpm, id }));
  service.onMetrics((batch, id, name) => samples.push(...batch.map((s) => ({ ...s, id, name }))));

  assert.equal(await service.connect('AA:BB', 'Vitals Hub'), true);
  const state = service.getConnectionState();
  assert.equal(state.error, null);
  assert.deepEqual(state.measures, ['heart_rate', 'blood_pressure', 'body_temperature']);
  assert.deepEqual([...monitors.keys()].sort(), ['2a1c', '2a35', '2a37']);

  monitors.get('2a37')(null, { value: b64([0x08, 75, 0xc8, 0x00]) }); // 75 bpm, 200 kJ
  monitors.get('2a1c')(null, { value: b64([0x00, 0x6e, 0x01, 0x00, 0xff]) }); // 36.6 °C
  monitors.get('2a35')(null, { value: b64([0x00, 0x78, 0x00, 0x50, 0x00, 0x5d, 0x00]) }); // 120/80

  assert.deepEqual(heartRates, [{ bpm: 75, id: 'android:AA:BB' }]);
  const byType = Object.fromEntries(samples.map((s) => [s.type, s]));
  assert.equal(Math.round(byType.energy.value), 48);
  assert.equal(byType.body_temperature.value, 36.6);
  assert.equal(byType.bp_systolic.value, 120);
  assert.equal(byType.bp_diastolic.value, 80);
  assert.equal(byType.bp_systolic.timestamp.getTime(), byType.bp_diastolic.timestamp.getTime());
  assert.ok(samples.every((s) => s.id === 'android:AA:BB' && s.name === 'Vitals Hub'));
  // Energy wasn't advertised as a service, so it's added once the device actually sends it
  assert.ok(service.getConnectionState().measures.includes('energy'));
});

test('a pulse oximeter reports SpO2 and feeds its pulse in as heart rate', async () => {
  const { service, monitors } = serviceWith(['1822']);
  const heartRates = [];
  const samples = [];
  service.onHeartRate((bpm) => heartRates.push(bpm));
  service.onMetrics((batch) => samples.push(...batch));
  await service.connect('CC:DD', 'Oximeter');
  assert.deepEqual(service.getConnectionState().measures, ['heart_rate', 'spo2']);
  monitors.get('2a5f')(null, { value: b64([0x00, 0x62, 0x00, 0x48, 0x00]) });
  assert.deepEqual(heartRates, [72]);
  assert.deepEqual(samples.map((s) => [s.type, s.value]), [['spo2', 98]]);
});

test('malformed packets and unsupported devices are handled quietly', async () => {
  const { service, monitors } = serviceWith(['1809']);
  const samples = [];
  service.onMetrics((batch) => samples.push(...batch));
  await service.connect('EE:FF', 'Thermometer');
  monitors.get('2a1c')(null, { value: b64([0x00, 0x01]) });
  monitors.get('2a1c')(new Error('link dropped'), null);
  assert.deepEqual(samples, []);

  const { service: none } = serviceWith(['183e']);
  await none.connect('11:22', 'Activity Monitor');
  assert.deepEqual(none.getConnectionState().measures, ['activity_monitor']);
  assert.match(none.getConnectionState().error, /doesn't provide heart rate or other supported health data/);
});
