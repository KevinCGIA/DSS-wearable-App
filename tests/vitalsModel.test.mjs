import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';
import * as metrics from '../src/lib/biometrics/metrics.ts';
import * as time from '../src/lib/time.ts';

const trends = loadAdapter('../src/lib/trends.ts', { './time': time });
const { buildVitals, totalsByBucket } = loadAdapter('../src/features/activity/vitalsModel.ts', {
  '@/lib/biometrics/metrics': metrics,
  '@/lib/trends': trends,
});

const HOUR = 3600000;
const now = new Date(2026, 9, 10, 15, 0).getTime();
const reading = (type, value, t, deviceId = 'ios:A') => ({
  id: `${type}-${t}-${deviceId}`, type, value, unit: metrics.STORED_UNITS[type], timestamp: new Date(t),
  deviceId, deviceName: deviceId, source: 'ble',
});

test('totalsByBucket adds each device on its own and counts a device reset as new progress', () => {
  const start = now - 3 * HOUR;
  const buckets = totalsByBucket(
    [
      reading('energy', 100, start + 10 * 60000),
      reading('energy', 150, start + 70 * 60000),
      reading('energy', 20, start + 130 * 60000), // reset to 0, then 20 burned
      reading('energy', 500, start + 75 * 60000, 'ios:B'),
      reading('energy', 530, start + 80 * 60000, 'ios:B'),
    ].sort((a, b) => a.timestamp - b.timestamp),
    start, now, HOUR,
  );
  assert.deepEqual([...buckets.map((b) => b.value)], [0, 80, 20]);
});

test('only metrics with readings get a card, in the standard order', () => {
  const views = buildVitals(
    {
      glucose: [reading('glucose', 5.4, now - HOUR)],
      spo2: [reading('spo2', 97, now - 2 * HOUR), reading('spo2', 99, now - HOUR)],
      weight: [],
    },
    now,
  );
  assert.deepEqual([...views.map((v) => v.metric.id)], ['spo2', 'glucose']);
  const spo2 = views[0];
  assert.equal(spo2.kind, 'live');
  assert.equal(spo2.latest.value, 99);
  assert.deepEqual([spo2.stats.low, spo2.stats.average, spo2.stats.high], [97, 98, 99]);
});

test('blood pressure pairs diastolic with systolic by timestamp and keeps 7 days of stats', () => {
  const t1 = now - 2 * 24 * HOUR;
  const t2 = now - HOUR;
  const old = now - 9 * 24 * HOUR;
  const [bp] = buildVitals(
    {
      bp_systolic: [reading('bp_systolic', 150, old), reading('bp_systolic', 120, t1), reading('bp_systolic', 130, t2)],
      bp_diastolic: [reading('bp_diastolic', 95, old), reading('bp_diastolic', 80, t1), reading('bp_diastolic', 84, t2)],
    },
    now,
  );
  assert.equal(bp.metric.id, 'blood_pressure');
  assert.equal(bp.kind, 'spot');
  assert.deepEqual([bp.latest.value, bp.latest.secondary], [130, 84]);
  assert.equal(bp.count, 2);
  assert.equal(bp.stats.average, 125);
  assert.equal(bp.stats.secondaryAverage, 82);
  assert.equal(bp.recent.length, 3);
});

test("a running total shows today's increase only, using yesterday's last value as the baseline", () => {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const [distance] = buildVitals(
    {
      distance: [
        reading('distance', 4000, midnight.getTime() - HOUR),
        reading('distance', 4600, midnight.getTime() + 9 * HOUR),
        reading('distance', 5200, midnight.getTime() + 14 * HOUR),
      ],
    },
    now,
  );
  assert.equal(distance.kind, 'total');
  assert.equal(distance.today, 1200);
});

test('a small dip in a running total is not a reset (two overlapping sample runs)', () => {
  const start = now - 2 * HOUR;
  const a = [100, 110, 120, 130];
  const b = [160, 171, 178, 190]; // a second run, well ahead of the first
  const readings = a.flatMap((v, i) => [
    reading('energy', v, start + i * 20 * 60000, null),
    reading('energy', b[i], start + i * 20 * 60000 + 1000, null),
  ]);
  const total = totalsByBucket(readings, start, now, HOUR).reduce((sum, bucket) => sum + bucket.value, 0);
  assert.equal(total, 90); // 100 -> 190, not hundreds
});
