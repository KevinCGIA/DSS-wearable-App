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

// Stored values are always metric (cm, kg), as on Android; imperial is display-only.
export type Units = 'metric' | 'imperial';

const CM_PER_IN = 2.54;
const KG_PER_LB = 0.45359237;

const round1 = (value: number) => Math.round(value * 10) / 10;

export function heightFor(units: Units, cm: number | null): number | null {
  return cm === null ? null : units === 'imperial' ? round1(cm / CM_PER_IN) : cm;
}

export function weightFor(units: Units, kg: number | null): number | null {
  return kg === null ? null : units === 'imperial' ? round1(kg / KG_PER_LB) : kg;
}

export function heightToCm(units: Units, value: number | null): number | null {
  return value === null ? null : units === 'imperial' ? round1(value * CM_PER_IN) : value;
}

export function weightToKg(units: Units, value: number | null): number | null {
  return value === null ? null : units === 'imperial' ? round1(value * KG_PER_LB) : value;
}

export function heightRangeFor(units: Units) {
  return units === 'imperial'
    ? { min: Math.round(HEIGHT_RANGE.min / CM_PER_IN), max: Math.round(HEIGHT_RANGE.max / CM_PER_IN) }
    : HEIGHT_RANGE;
}

export function weightRangeFor(units: Units) {
  return units === 'imperial'
    ? { min: Math.round(WEIGHT_RANGE.min / KG_PER_LB), max: Math.round(WEIGHT_RANGE.max / KG_PER_LB) }
    : WEIGHT_RANGE;
}

export const unitLabels = (units: Units) =>
  units === 'imperial' ? { height: 'in', weight: 'lb', distance: 'mi' } : { height: 'cm', weight: 'kg', distance: 'km' };

const KM_PER_MI = 1.609344;

export function distanceFor(units: Units, km: number | null): number | null {
  return km === null ? null : units === 'imperial' ? km / KM_PER_MI : km;
}
