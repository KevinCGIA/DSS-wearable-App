import type { AlertThresholds } from '@/data/types';

export const HR_MIN_RANGE = { min: 30, max: 100 } as const;
export const HR_MAX_RANGE = { min: 80, max: 220 } as const;
export const HR_MIN_GAP = 10;
export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = { enabled: true, hrMin: 50, hrMax: 120 };

const finiteNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export function thresholdsFromDocument(data: Record<string, unknown> | undefined): AlertThresholds {
  return {
    enabled: typeof data?.enabled === 'boolean' ? data.enabled : DEFAULT_ALERT_THRESHOLDS.enabled,
    hrMin: finiteNumber(data?.hrMin, DEFAULT_ALERT_THRESHOLDS.hrMin),
    hrMax: finiteNumber(data?.hrMax, DEFAULT_ALERT_THRESHOLDS.hrMax),
  };
}

export function validateThresholds({ hrMin, hrMax }: AlertThresholds): string | null {
  if (!Number.isFinite(hrMin) || hrMin < HR_MIN_RANGE.min || hrMin > HR_MIN_RANGE.max) {
    return `Minimum must be between ${HR_MIN_RANGE.min} and ${HR_MIN_RANGE.max} BPM.`;
  }
  if (!Number.isFinite(hrMax) || hrMax < HR_MAX_RANGE.min || hrMax > HR_MAX_RANGE.max) {
    return `Maximum must be between ${HR_MAX_RANGE.min} and ${HR_MAX_RANGE.max} BPM.`;
  }
  if (hrMax - hrMin < HR_MIN_GAP) {
    return `Maximum must be at least ${HR_MIN_GAP} BPM above minimum.`;
  }
  return null;
}
