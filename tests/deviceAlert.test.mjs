import assert from 'node:assert/strict';
import test from 'node:test';
import { connectionLostAlert, lowBatteryAlert, LOW_BATTERY_PERCENT } from '../src/lib/alerts/deviceAlert.ts';

const device = { deviceId: 'android:AA', deviceName: 'Strap' };

test('a lost connection alerts only after reconnecting has given up', () => {
  const lost = connectionLostAlert('reconnecting', 'disconnected', true, device, 5000);
  assert.equal(lost.type, 'DEVICE_DISCONNECTED');
  assert.match(lost.message, /Strap/);
  assert.equal(lost.timestamp, 5000);
  // The user pressed Cancel while it was reconnecting: no error, no alert
  assert.equal(connectionLostAlert('reconnecting', 'disconnected', false, device, 0), null);
  // The user disconnected, the drop recovered, or it never connected
  assert.equal(connectionLostAlert('connected', 'disconnected', false, device, 0), null);
  assert.equal(connectionLostAlert('disconnecting', 'disconnected', false, device, 0), null);
  assert.equal(connectionLostAlert('reconnecting', 'connected', false, device, 0), null);
  assert.equal(connectionLostAlert('connecting', 'disconnected', true, device, 0), null);
  assert.equal(connectionLostAlert(undefined, 'disconnected', true, device, 0), null);
});

test('low battery alerts once, at or under the limit, and never without a reported level', () => {
  assert.equal(lowBatteryAlert(null, false, device, 0), null);
  assert.equal(lowBatteryAlert(LOW_BATTERY_PERCENT + 1, false, device, 0), null);
  const low = lowBatteryAlert(LOW_BATTERY_PERCENT, false, device, 7);
  assert.deepEqual([low.type, low.value, low.deviceId], ['BATTERY_LOW', 20, 'android:AA']);
  assert.equal(lowBatteryAlert(12, true, device, 0), null);
  assert.match(lowBatteryAlert(12.4, false, { deviceId: 'x', deviceName: null }, 0).message, /Unknown device · Battery at 12%/);
});
