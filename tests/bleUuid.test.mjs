import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalGattUuid, sharesAdvertisedService } from '../src/lib/ble/uuid.ts';

test('recognises compact and expanded Heart Rate service UUIDs in advertisements', () => {
  const full = '0000180d-0000-1000-8000-00805f9b34fb';
  assert.equal(canonicalGattUuid('180D'), full);
  assert.equal(canonicalGattUuid('0000180D'), full);
  assert.equal(sharesAdvertisedService(['180D'], [full]), true);
  assert.equal(sharesAdvertisedService([full.toUpperCase()], ['180d']), true);
  assert.equal(sharesAdvertisedService(['180F'], [full]), false);
});
