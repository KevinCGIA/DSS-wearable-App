import assert from 'node:assert/strict';
import test from 'node:test';
import { subscribeWithDeadline, withDeadline } from '../src/lib/asyncDeadline.ts';

test('a stalled operation times out, invokes cancellation and ignores late settlement', async () => {
  let cancelled = false;
  let finish;
  const result = withDeadline(new Promise((resolve) => { finish = resolve; }), 5, () => { cancelled = true; });
  await assert.rejects(result, { code: 'operation/timeout' });
  assert.equal(cancelled, true);
  finish(42);
  assert.equal(await withDeadline(Promise.resolve(7), 5), 7);
});

test('subscription ends loading on timeout, recovers on data and suppresses events after cleanup', async () => {
  let emit;
  let removed = false;
  const values = [];
  const errors = [];
  const stop = subscribeWithDeadline((onData) => { emit = onData; return () => { removed = true; }; },
    (value) => values.push(value), (error) => errors.push(error), 5);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(errors.length, 1);
  emit('recovered');
  stop();
  emit('stale');
  assert.deepEqual(values, ['recovered']);
  assert.equal(removed, true);
});

test('subscription catches synchronous errors and forwards permission errors unchanged', () => {
  const denied = new Error('permission-denied');
  let received;
  const stop = subscribeWithDeadline(() => { throw denied; }, () => {}, (error) => { received = error; });
  assert.equal(received, denied);
  stop();
});
