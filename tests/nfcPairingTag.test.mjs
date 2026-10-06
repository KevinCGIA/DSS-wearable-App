import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPairingUri, parsePairingRecords } from '../src/lib/nfc/pairingTag.ts';

const bytes = (text) => [...Buffer.from(text)];

test("reads the app's own pairing tags", () => {
  const uri = buildPairingUri({ deviceId: 'AA:BB:CC:DD:EE:FF', name: 'Polar H10 & Co' });
  const expected = { deviceId: 'AA:BB:CC:DD:EE:FF', name: 'Polar H10 & Co' };
  assert.deepEqual(parsePairingRecords([{ tnf: 1, type: bytes('U'), payload: [0, ...bytes(uri)] }]), expected);
  assert.deepEqual(parsePairingRecords([{ tnf: 1, type: 'U', payload: [0, ...bytes(uri)] }]), expected);
});

test('reads Bluetooth LE out-of-band pairing records', () => {
  // LE address 11:22:33:44:55:66 (least significant byte first) + type, complete name "HRM", role
  const payload = [8, 0x1b, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11, 0x00, 4, 0x09, ...bytes('HRM'), 2, 0x1c, 0x00];
  assert.deepEqual(
    parsePairingRecords([{ tnf: 2, type: bytes('application/vnd.bluetooth.le.oob'), payload }]),
    { deviceId: '11:22:33:44:55:66', name: 'HRM' },
  );
});

test('ignores tags that are not pairing tags, and malformed ones', () => {
  assert.equal(parsePairingRecords([{ tnf: 1, type: bytes('U'), payload: [4, ...bytes('example.com')] }]), null);
  assert.equal(parsePairingRecords([{ tnf: 1, type: bytes('T'), payload: [2, ...bytes('en'), ...bytes('hi')] }]), null);
  assert.equal(parsePairingRecords([]), null);
  assert.equal(
    parsePairingRecords([{ tnf: 2, type: bytes('application/vnd.bluetooth.le.oob'), payload: [200, 0x1b, 1] }]),
    null,
  );
});
