import { useCallback, useState } from 'react';
import { exportReadings } from '@/lib/export/exportReadings';
import type { ExportRange } from '@/lib/export/exportTypes';
import type { ExportNotice } from './ExportScreen';

const rangeText: Record<ExportRange, string> = { '24h': 'the last 24 hours', '7d': 'the last 7 days', '30d': 'the last 30 days' };

export function useExportData() {
  const [range, setRange] = useState<ExportRange>('24h');
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<ExportNotice | null>(null);

  const onExport = useCallback(async () => {
    setNotice(null);
    setExporting(true);
    try {
      const result = await exportReadings(range);
      if (!result.rows) {
        setNotice({ tone: 'info', message: `No readings were saved in ${rangeText[range]}.` });
      } else if (result.truncated) {
        setNotice({
          tone: 'info',
          message: `Exported the newest ${result.rows.toLocaleString()} readings. There were more than fit in one file: choose a shorter range for the rest.`,
        });
      } else {
        setNotice({ tone: 'success', message: `Exported ${result.rows.toLocaleString()} readings.` });
      }
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
      setNotice({
        tone: 'error',
        message: code.includes('unavailable')
          ? "Couldn't export: no connection, or this phone can't share files."
          : "Couldn't export your readings. Try again in a moment.",
      });
    } finally {
      setExporting(false);
    }
  }, [range]);

  return {
    range,
    exporting,
    notice,
    onChangeRange: (next: ExportRange) => { setRange(next); setNotice(null); },
    onExport,
  };
}
