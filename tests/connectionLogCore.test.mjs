import assert from 'node:assert/strict';
import test from 'node:test';
import { boundedEvents, resumeConnectionLog } from '../src/lib/devices/connectionLogCore.ts';
import { loadAdapter } from './loadAdapter.mjs';
import * as thresholds from '../src/lib/devices/healthThresholds.ts';
const stats = loadAdapter('../src/lib/devices/deviceStats.ts', {
  '@/lib/time': { isSameDay: (a, b) => a.toDateString() === b.toDateString() }, './healthThresholds': thresholds,
});

const event = (type, timestamp, reason) => ({ id: `${type}-${timestamp}`, type, timestamp, deviceId: type.startsWith('app_') ? null : 'ios:A', ...(reason ? { reason } : {}) });
const reading = (timestamp, resolution = 'sample') => ({ id: `${timestamp}`, type: 'heart_rate', value: 70, unit: 'bpm', timestamp: new Date(timestamp), deviceId: 'ios:A', deviceName: 'A', source: 'ble', resolution });

test('log bounds preserve the latest thousand events within thirty days', () => {
  const now = 31 * 86400000;
  const many = Array.from({ length: 1200 }, (_, i) => event('connected', now - i * 1000));
  many.push(event('connected', 0));
  const kept = boundedEvents(many, now);
  assert.equal(kept.length, 1000);
  assert.ok(kept.every((item) => item.timestamp >= now - 30 * 86400000));
  assert.ok(kept[0].timestamp <= kept.at(-1).timestamp);
});

test('unclean process close creates a background interval on relaunch', () => {
  let id = 0;
  const resumed = resumeConnectionLog({ events: [event('app_foreground', 100), event('connected', 150)], updatedAt: 200, foreground: true }, 60000, () => `${++id}`);
  assert.deepEqual(resumed.slice(-2).map((item) => [item.type, item.timestamp]), [['app_background', 200], ['app_foreground', 60000]]);
});

test('stats separate real drops from user disconnects and exclude background time', () => {
  const events = [event('connected', 1000), event('app_background', 2000), event('app_foreground', 40000), event('disconnected', 50000, 'unexpected'), event('connected', 60000), event('disconnected', 70000, 'user')];
  const readings = [reading(1200), reading(1800), reading(42000), reading(42500), reading(60500), reading(61000)];
  const result = stats.computeDeviceStats('ios:A', events, readings, [], 80000);
  assert.equal(result.dropOuts, 1);
  assert.equal(result.gaps, 0, 'background interval must not count as a gap');
  assert.equal(result.totalSessions, 2);
  assert.equal(result.connectedMs, 11000 + 10000);
  assert.equal(result.sessions[0].endedBy, 'user');
});

test('representative readings do not invent full-resolution gaps', () => {
  const events = [event('connected', 1000), event('disconnected', 200000, 'user')];
  const old = [reading(2000, 'representative'), reading(62000, 'representative'), reading(122000, 'representative')];
  assert.equal(stats.computeDeviceStats('ios:A', events, old, [], 201000).gaps, 0);
  assert.equal(stats.computeDeviceStats('ios:A', events, [reading(2000), reading(62000)], [], 201000).gaps, 1);
});
