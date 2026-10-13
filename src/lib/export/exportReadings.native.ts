import { getAuth } from '@react-native-firebase/auth';
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from '@react-native-firebase/firestore';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SensorReading } from '@/data/types';
import { batchFromDocument, batchReadings } from '../sensors/readingDocuments';
import { flushReadings } from '../sensors/readings.native';
import { exportFileName, readingsToCsv } from './csv';
import { EXPORT_RANGE_MS, MAX_EXPORT_ROWS, type ExportRange, type ExportResult } from './exportTypes';

const PAGE = 250;

function failure(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

// Reads from Firestore, newest first, so a huge range keeps the latest data.
async function fetchReadings(uid: string, since: number): Promise<{ readings: SensorReading[]; truncated: boolean }> {
  const batches = collection(getFirestore(), 'users', uid, 'reading_batches');
  const readings: SensorReading[] = [];
  let cursor: QueryDocumentSnapshot | null = null;
  for (;;) {
    const constraints = [where('endAt', '>=', Timestamp.fromMillis(since)), orderBy('endAt', 'desc')];
    const next = cursor ? query(batches, ...constraints, startAfter(cursor), limit(PAGE)) : query(batches, ...constraints, limit(PAGE));
    const page: QuerySnapshot = await getDocs(next);
    for (const document of page.docs) {
      const batch = batchFromDocument(document.id, document.data());
      if (!batch || (!__DEV__ && batch.source !== 'ble')) continue;
      for (const reading of batchReadings(batch)) if (reading.timestamp.getTime() >= since) readings.push(reading);
    }
    if (readings.length >= MAX_EXPORT_ROWS) return { readings, truncated: true };
    if (page.size < PAGE) return { readings, truncated: false };
    cursor = page.docs[page.docs.length - 1];
  }
}

// Writes the CSV to the cache and opens the share sheet. Zero rows = nothing shared.
export async function exportReadings(range: ExportRange, now = Date.now()): Promise<ExportResult> {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw failure('auth/no-current-user', 'Sign in to export your readings.');
  if (!(await Sharing.isAvailableAsync())) throw failure('export/unavailable', "This phone can't share files.");
  // upload anything still queued first
  flushReadings();
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const fetched = await fetchReadings(uid, now - EXPORT_RANGE_MS[range]);
  fetched.readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const rows = fetched.readings.slice(-MAX_EXPORT_ROWS);
  if (!rows.length) return { rows: 0, truncated: false };

  const file = new File(Paths.cache, exportFileName(new Date(now)));
  file.create({ overwrite: true });
  file.write(readingsToCsv(rows));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export readings',
  });
  return { rows: rows.length, truncated: fetched.truncated || fetched.readings.length > rows.length };
}
