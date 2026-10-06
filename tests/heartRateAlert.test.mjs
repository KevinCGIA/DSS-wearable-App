import assert from 'node:assert/strict';
import test from 'node:test';
import { alertCooldownKey, checkHeartRate } from '../src/lib/alerts/heartRateAlert.ts';

const at = 100000;
const thresholds = { enabled: true, hrMin: 50, hrMax: 120 };
const reading = (value, deviceId = 'ios:A', source = 'ble', timestamp = at) => ({
  id: 'sample', type: 'heart_rate', value, unit: 'bpm', timestamp: new Date(timestamp),
  deviceId, deviceName: deviceId === 'ios:A' ? 'Polar A' : 'Polar B', source, resolution: 'sample',
});

test('strict threshold boundaries and disabled setting', () => {
  assert.equal(checkHeartRate(reading(120), thresholds), null);
  assert.equal(checkHeartRate(reading(50), thresholds), null);
  assert.equal(checkHeartRate(reading(121), { ...thresholds, enabled: false }), null);
  assert.deepEqual([checkHeartRate(reading(121), thresholds)?.type, checkHeartRate(reading(49), thresholds)?.type], ['HR_HIGH', 'HR_LOW']);
  assert.match(checkHeartRate(reading(121), thresholds).message, /Polar A/);
});

test('cooldown applies separately to device and alert type', () => {
  const previous = new Map();
  const accept = (sample, now) => {
    const type = sample.value > thresholds.hrMax ? 'HR_HIGH' : 'HR_LOW';
    const key = alertCooldownKey(sample, type);
    const alert = checkHeartRate(sample, thresholds, previous.get(key), now);
    if (alert) previous.set(key, now);
    return alert;
  };
  assert.ok(accept(reading(121), at));
  assert.equal(accept(reading(122, 'ios:A', 'ble', at + 50000), at + 50000), null);
  assert.ok(accept(reading(121, 'ios:B', 'ble', at + 50000), at + 50000));
  assert.ok(accept(reading(49, 'ios:A', 'ble', at + 50000), at + 50000));
  assert.ok(accept(reading(123, 'ios:A', 'ble', at + 60000), at + 60000));
});

test('ignores historical, representative, manual and production test readings', () => {
  assert.equal(checkHeartRate(reading(130, 'ios:A', 'ble', at - 20000), thresholds, undefined, at), null);
  assert.equal(checkHeartRate({ ...reading(130), resolution: 'representative' }, thresholds), null);
  assert.equal(checkHeartRate(reading(130, null, 'manual'), thresholds), null);
  assert.equal(checkHeartRate(reading(130, null, 'test'), thresholds), null);
  assert.ok(checkHeartRate(reading(130, null, 'test'), thresholds, undefined, at, true));
});
