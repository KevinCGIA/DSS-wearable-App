import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_ALERT_THRESHOLDS,
  thresholdsFromDocument,
  validateThresholds,
} from '../src/lib/alerts/thresholdsCore.ts';
import { loadAdapter } from './loadAdapter.mjs';

const { createNativeThresholdStore } = loadAdapter('../src/lib/alerts/nativeThresholdStore.ts', {
  './thresholdsCore': { thresholdsFromDocument, validateThresholds },
});
const normalized = (value) => JSON.parse(JSON.stringify(value));

function fixture({ uid = 'user-1', document, overrides = {} } = {}) {
  let currentUid = uid;
  let onData;
  let onSubscriptionError;
  let unsubscribeCount = 0;
  const writes = [];
  const timestamp = { kind: 'server-timestamp' };
  const store = createNativeThresholdStore({
    currentUid: () => currentUid,
    subscribeDocument: (_uid, next, error) => {
      onData = next;
      onSubscriptionError = error;
      next(document);
      return () => { unsubscribeCount++; };
    },
    writeDocument: async (owner, data) => { writes.push([owner, data]); },
    serverTimestamp: () => timestamp,
    ...overrides,
  });
  return {
    store,
    writes,
    timestamp,
    emit: (data) => onData(data),
    fail: (error) => onSubscriptionError(error),
    setUid: (next) => { currentUid = next; },
    get unsubscribeCount() { return unsubscribeCount; },
  };
}

test('missing and partial documents use the required defaults', () => {
  assert.deepEqual(thresholdsFromDocument(undefined), DEFAULT_ALERT_THRESHOLDS);
  assert.deepEqual(thresholdsFromDocument({ enabled: false }), {
    enabled: false, hrMin: 50, hrMax: 120,
  });
  assert.deepEqual(thresholdsFromDocument({ enabled: 'yes', hrMin: NaN, hrMax: Infinity }),
    DEFAULT_ALERT_THRESHOLDS);
  assert.deepEqual(thresholdsFromDocument({ enabled: false, hrMin: 45, hrMax: 160, updatedAt: 'ignored' }), {
    enabled: false, hrMin: 45, hrMax: 160,
  });
});

test('validation retains the existing range and gap rules and rejects non-finite values', () => {
  assert.equal(validateThresholds(DEFAULT_ALERT_THRESHOLDS), null);
  assert.match(validateThresholds({ enabled: true, hrMin: 29, hrMax: 120 }), /Minimum/);
  assert.match(validateThresholds({ enabled: true, hrMin: 50, hrMax: 221 }), /Maximum/);
  assert.match(validateThresholds({ enabled: true, hrMin: 75, hrMax: 80 }), /at least 10/);
  assert.match(validateThresholds({ enabled: true, hrMin: NaN, hrMax: 120 }), /Minimum/);
  assert.match(validateThresholds({ enabled: true, hrMin: 50, hrMax: Infinity }), /Maximum/);
});

test('subscription emits parsed thresholds and propagates Firestore errors', () => {
  const f = fixture({ document: undefined });
  const values = [];
  const errors = [];
  const unsubscribe = f.store.subscribe('user-1', (value) => values.push(value), (error) => errors.push(error));
  f.emit({ enabled: false, hrMin: 45, hrMax: 150, updatedAt: f.timestamp });
  const denied = Object.assign(new Error('denied'), { code: 'firestore/permission-denied' });
  f.fail(denied);
  assert.deepEqual(values, [DEFAULT_ALERT_THRESHOLDS, { enabled: false, hrMin: 45, hrMax: 150 }]);
  assert.equal(errors[0], denied);
  unsubscribe();
  assert.equal(f.unsubscribeCount, 1);
});

test('subscription requires the current owner and suppresses stale account data', async () => {
  const signedOut = fixture({ uid: null });
  const errors = [];
  signedOut.store.subscribe('user-1', () => assert.fail('must not emit'), (error) => errors.push(error));
  await Promise.resolve();
  assert.equal(errors[0].code, 'auth/no-current-user');

  const f = fixture({ document: DEFAULT_ALERT_THRESHOLDS });
  const values = [];
  const switchedErrors = [];
  f.store.subscribe('user-1', (value) => values.push(value), (error) => switchedErrors.push(error));
  f.setUid('user-2');
  f.emit({ enabled: false, hrMin: 40, hrMax: 130 });
  assert.equal(values.length, 1);
  assert.equal(switchedErrors[0].code, 'auth/user-mismatch');
});

test('save writes exactly the additive alert fields plus a server timestamp', async () => {
  const f = fixture();
  await f.store.save('user-1', { enabled: false, hrMin: 45, hrMax: 155 });
  assert.deepEqual(normalized(f.writes), [[
    'user-1',
    { enabled: false, hrMin: 45, hrMax: 155, updatedAt: f.timestamp },
  ]]);
});

test('save rejects invalid thresholds, signed-out users and the wrong account before writing', async () => {
  for (const [uid, owner, thresholds, code] of [
    [null, 'user-1', DEFAULT_ALERT_THRESHOLDS, 'auth/no-current-user'],
    ['user-2', 'user-1', DEFAULT_ALERT_THRESHOLDS, 'auth/user-mismatch'],
    ['user-1', 'user-1', { enabled: true, hrMin: 100, hrMax: 105 }, 'alerts/invalid-thresholds'],
  ]) {
    const f = fixture({ uid });
    await assert.rejects(f.store.save(owner, thresholds), { code });
    assert.deepEqual(normalized(f.writes), []);
  }
});

test('save does not report success if the account changes while the write is pending', async () => {
  let finish;
  const f = fixture({ overrides: {
    writeDocument: () => new Promise((resolve) => { finish = resolve; }),
  } });
  const pending = f.store.save('user-1', DEFAULT_ALERT_THRESHOLDS);
  f.setUid('user-2');
  finish();
  await assert.rejects(pending, { code: 'auth/user-mismatch' });
});

test('Firestore write errors propagate unchanged', async () => {
  const denied = Object.assign(new Error('denied'), { code: 'firestore/permission-denied' });
  const f = fixture({ overrides: { writeDocument: async () => { throw denied; } } });
  await assert.rejects(f.store.save('user-1', DEFAULT_ALERT_THRESHOLDS), (error) => error === denied);
});
