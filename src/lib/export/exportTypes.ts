export type ExportRange = '24h' | '7d' | '30d';

export const EXPORT_RANGE_MS: Record<ExportRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

// about 15 MB of CSV
export const MAX_EXPORT_ROWS = 200000;

export type ExportResult = {
  rows: number;
  // the range held more than fits; the file has the newest
  truncated: boolean;
};
