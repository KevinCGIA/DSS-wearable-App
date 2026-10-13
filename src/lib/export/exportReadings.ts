import type { SensorReading } from '@/data/types';
import { SENSOR_TYPES } from '../biometrics/metrics';
import { subscribeToReadingsSince } from '../sensors/readings';
import { exportFileName, readingsToCsv } from './csv';
import { EXPORT_RANGE_MS, MAX_EXPORT_ROWS, type ExportRange, type ExportResult } from './exportTypes';

// Web/preview version: downloads the in-memory readings.
export async function exportReadings(range: ExportRange, now = Date.now()): Promise<ExportResult> {
  const since = new Date(now - EXPORT_RANGE_MS[range]);
  const all: SensorReading[] = [];
  for (const type of SENSOR_TYPES) {
    const stop = subscribeToReadingsSince('current-user', type, since, (readings) => { all.push(...readings); }, () => undefined);
    stop();
  }
  all.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const rows = all.slice(-MAX_EXPORT_ROWS);
  if (rows.length && typeof document !== 'undefined') {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([readingsToCsv(rows)], { type: 'text/csv' }));
    link.download = exportFileName(new Date(now));
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return { rows: rows.length, truncated: all.length > rows.length };
}
