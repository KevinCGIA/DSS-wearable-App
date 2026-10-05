import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHeartRateMeasurement } from '../src/lib/ble/heartRateMeasurement.ts';

test('decodes 8-bit and 16-bit Bluetooth heart-rate measurements', () => {
  assert.equal(parseHeartRateMeasurement(Buffer.from([0x00, 0x46]).toString('base64')), 70);
  assert.equal(parseHeartRateMeasurement(Buffer.from([0x00, 0x64]).toString('base64')), 100);
  assert.equal(parseHeartRateMeasurement(Buffer.from([0x00, 72]).toString('base64')), 72);
  assert.equal(parseHeartRateMeasurement(Buffer.from([0x01, 0x2c, 0x01]).toString('base64')), 300);
  assert.equal(parseHeartRateMeasurement(Buffer.from([0x00, 0]).toString('base64')), null);
  assert.equal(parseHeartRateMeasurement(Buffer.from([0x01, 0x2c]).toString('base64')), null);
});

test('ignores empty, truncated and malformed packets without throwing', () => {
  for (const value of ['', 'AA==', 'ASw=', '%%%']) assert.equal(parseHeartRateMeasurement(value), null);
});
