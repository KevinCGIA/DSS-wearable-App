import type { SensorReading } from '@/data/types';
import { METRIC_BY_ID, metricForType } from '../biometrics/metrics';

// One row per reading, oldest first, in stored (metric) units.

export const CSV_COLUMNS = ['time_utc', 'time_local', 'metric', 'type', 'value', 'unit', 'device', 'device_id', 'source'] as const;

const two = (n: number) => String(n).padStart(2, '0');

function localTime(date: Date) {
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`;
}

// quote where needed and neutralise spreadsheet formulas
function cell(value: string | number): string {
  if (typeof value === 'number') return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function readingsToCsv(readings: SensorReading[]): string {
  const rows = [CSV_COLUMNS.join(',')];
  for (const reading of readings) {
    const test = reading.source !== 'ble';
    rows.push([
      reading.timestamp.toISOString(),
      localTime(reading.timestamp),
      METRIC_BY_ID[metricForType(reading.type)].label,
      reading.type,
      reading.value,
      reading.unit,
      test ? 'Test data' : (reading.deviceName ?? 'Unknown device'),
      test ? '' : (reading.deviceId ?? ''),
      test ? 'test' : 'device',
    ].map(cell).join(','));
  }
  // CRLF line endings
  return `${rows.join('\r\n')}\r\n`;
}

export function exportFileName(now: Date): string {
  return `dss-readings-${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}-${two(now.getHours())}${two(now.getMinutes())}.csv`;
}
