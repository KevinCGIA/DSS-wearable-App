// Height/weight arrive as text from inputs (Android stores them as strings; see ANDROID_BUGS.md #4).

export const HEIGHT_RANGE = { min: 50, max: 250 } as const;
export const WEIGHT_RANGE = { min: 20, max: 300 } as const;

export function parseMeasure(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function measureError(
  value: string,
  range: { min: number; max: number },
  label: string,
): string | undefined {
  const parsed = parseMeasure(value);
  if (parsed === null) return undefined;
  if (Number.isNaN(parsed) || parsed < range.min || parsed > range.max) {
    return `${label} between ${range.min} and ${range.max}.`;
  }
  return undefined;
}

export function formatMeasure(value: number | null): string {
  return value === null ? '' : String(value);
}
