import assert from 'node:assert/strict';
import test from 'node:test';
import { ReadingBatchQueue, MAX_BATCH_SAMPLES } from '../src/lib/sensors/readingBatches.ts';
import { loadAdapter } from './loadAdapter.mjs';
import * as keys from '../src/lib/ble/deviceKey.ts';
const { legacyReading, batchReadings, mergeReadings } = loadAdapter('../src/lib/sensors/readingDocuments.ts', { '../ble/deviceKey': keys });

const input = (deviceId = 'A') => ({ deviceId, deviceName: deviceId, platform: 'ios', type: 'heart_rate', source: 'ble' });
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
function harness(write = async () => {}) {
  let id = 0;
  let saved = null;
  const errors = [];
  const writes = [];
  const queue = new ReadingBatchQueue({
    id: () => `batch-${++id}`, save: async (json) => { saved = json; },
    write: async (batch) => {
      assert.ok(JSON.parse(saved).pending.some((stored) => stored.id === batch.id), 'must persist before upload');
      writes.push(structuredClone(batch)); await write(batch);
    },
    onError: (error) => errors.push(error),
  });
  return { queue, writes, errors, saved: () => saved };
}

test('separates devices and emits full samples with one representative per minute', async () => {
  const { queue, writes } = harness();
  for (let t = 0; t < 60000; t += 1000) {
    queue.add(input('A'), { t, v: 70 }); queue.add(input('B'), { t, v: 100 });
  }
  await queue.flush(); await tick();
  assert.equal(writes.length, 2);
  assert.equal(writes[0].samples.length, 60);
  assert.equal(writes[1].samples.every((s) => s.v === 100), true);
  assert.deepEqual(writes[0].legacy, { t: 59000, v: 70 });
  queue.add(input('A'), { t: 61000, v: 71 });
  await queue.flush('A'); await tick();
  assert.equal(writes[2].legacy, null);
});

test('failed uploads retain payload and identity across a restart and replay', async () => {
  const original = harness(async () => { throw new Error('offline'); });
  original.queue.add(input(), { t: 1, v: 70 });
  await original.queue.flush(); await tick();
  assert.equal(original.errors.length, 1);
  const restored = harness();
  restored.queue.restore(original.saved());
  await restored.queue.flush(); await tick();
  assert.equal(restored.writes[0].id, original.writes[0].id);
  assert.deepEqual(restored.writes[0].samples, [{ t: 1, v: 70 }]);
  assert.equal(restored.queue.batches().length, 0);
});

test('pending offline commit does not block new batches or resend an in-flight ID', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const { queue, writes } = harness(() => gate);
  queue.add(input(), { t: 0, v: 70 }); await queue.flush();
  queue.add(input(), { t: 60000, v: 71 }); await queue.flush();
  await queue.flush();
  assert.equal(writes.length, 2);
  assert.notEqual(writes[0].id, writes[1].id);
  release(); await tick();
  assert.equal(queue.batches().length, 0);
});

test('splits oversized batches and stops new uploads at account teardown', async () => {
  const { queue, writes } = harness();
  for (let i = 0; i <= MAX_BATCH_SAMPLES; i++) queue.add(input(), { t: i, v: 70 });
  assert.equal(queue.batches().length, 2);
  await queue.stop();
  await queue.flush();
  assert.equal(writes.length, 0);
  assert.throws(() => queue.add(input(), { t: 1000, v: 70 }), /not active/);
});

test('old documents tolerate missing source/device and full samples replace representatives', () => {
  const legacy = legacyReading('legacy', 'heart_rate', { value: 70, timestamp: { toMillis: () => 1000 }, deviceId: 'A', platform: 'ios' });
  const full = batchReadings({ ...input(), id: 'batch', samples: [{ t: 1000, v: 70 }, { t: 2000, v: 80 }] });
  assert.equal(mergeReadings([legacy, ...full, ...full]).length, 2);
  const unknown = legacyReading('unknown', 'heart_rate', { value: 80, timestamp: 2000 });
  assert.equal(unknown.deviceId, null);
  assert.equal(unknown.source, 'ble');
  const testReading = legacyReading('test', 'heart_rate', { value: 90, timestamp: 3000, source: 'manual' });
  assert.equal(testReading.source, 'test');
  assert.equal(legacyReading('bad', 'heart_rate', { value: NaN, timestamp: 1 }), null);
});

test('a failed local checkpoint prevents any network submission', async () => {
  let writes = 0;
  const queue = new ReadingBatchQueue({ id: () => 'stable', save: async () => { throw new Error('disk full'); }, write: async () => { writes++; }, onError() {} });
  queue.add(input(), { t: 0, v: 70 });
  await assert.rejects(queue.flush(), /disk full/);
  assert.equal(writes, 0);
  assert.equal(queue.batches()[0].samples.length, 1);
});

test('an acknowledgement after account teardown cannot rewrite the durable queue', async () => {
  let finish;
  const gate = new Promise((resolve) => { finish = resolve; });
  const h = harness(() => gate);
  h.queue.add(input(), { t: 0, v: 70 }); await h.queue.flush();
  await h.queue.stop();
  const saved = h.saved();
  finish(); await tick();
  assert.equal(h.saved(), saved);
  assert.equal(h.queue.batches().length, 1);
});
