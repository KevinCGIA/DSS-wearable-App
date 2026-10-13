import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdapter } from './loadAdapter.mjs';
import * as metrics from '../src/lib/biometrics/metrics.ts';

const { CSV_COLUMNS, exportFileName, readingsToCsv } = loadAdapter('../src/lib/export/csv.ts', { '../biometrics/metrics': metrics });
const reading = (changes) => ({
  id: 'r', type: 'heart_rate', value: 72, unit: 'bpm', timestamp: new Date(Date.UTC(2026, 9, 10, 8, 30, 5)),
  deviceId: 'android:AA:BB', deviceName: 'Polar H10', source: 'ble', ...changes,
});

test('one row per reading, with UTC time, the metric name and the device', () => {
  const lines = readingsToCsv([reading({}), reading({ type: 'bp_systolic', value: 120, unit: 'mmHg' })]).split('\r\n');
  assert.equal(lines[0], [...CSV_COLUMNS].join(','));
  const first = lines[1].split(',');
  assert.equal(first[0], '2026-10-10T08:30:05.000Z');
  assert.deepEqual(first.slice(2), ['Heart Rate', 'heart_rate', '72', 'bpm', 'Polar H10', 'android:AA:BB', 'device']);
  assert.match(lines[2], /,Blood Pressure,bp_systolic,120,mmHg,/);
  assert.equal(lines.at(-1), ''); // ends with a newline
});

test('test data is labelled and carries no device ID', () => {
  const row = readingsToCsv([reading({ source: 'test', deviceId: null, deviceName: 'Sample data' })]).split('\r\n')[1];
  assert.match(row, /,Test data,,test$/);
});

test('device names cannot break the file or run as spreadsheet formulas', () => {
  const rows = readingsToCsv([
    reading({ deviceName: 'Band, "Pro"' }),
    reading({ deviceName: '=HYPERLINK("x")' }),
    reading({ deviceName: null }),
  ]).split('\r\n');
  assert.match(rows[1], /,"Band, ""Pro""",/);
  assert.match(rows[2], /,"'=HYPERLINK\(""x""\)",/);
  assert.match(rows[3], /,Unknown device,/);
});

test('file names sort by date and time', () => {
  assert.equal(exportFileName(new Date(2026, 9, 5, 7, 4)), 'dss-readings-2026-10-05-0704.csv');
});
