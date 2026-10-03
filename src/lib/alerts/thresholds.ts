import { mockAlertThresholds } from '@/data/mocks';
import type { AlertThresholds } from '@/data/types';

// In-memory stand-in for users/{uid}/settings/alerts (Phase 2, CLAUDE.md step 6).
// Same subscribe/save shape as Android's Firestore helpers, so Phase 2 swaps only this file.

export const HR_MIN_RANGE = { min: 30, max: 100 } as const;
export const HR_MAX_RANGE = { min: 80, max: 220 } as const;
export const HR_MIN_GAP = 10;

let current: AlertThresholds = mockAlertThresholds;
const listeners = new Set<(thresholds: AlertThresholds) => void>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function subscribeToAlertThresholds(
  _uid: string,
  onThresholds: (thresholds: AlertThresholds) => void,
  _onError: (error: Error) => void,
): () => void {
  listeners.add(onThresholds);
  const timer = setTimeout(() => onThresholds(current), 300);
  return () => {
    clearTimeout(timer);
    listeners.delete(onThresholds);
  };
}

export async function saveAlertThresholds(_uid: string, thresholds: AlertThresholds): Promise<void> {
  await wait(600);
  current = thresholds;
  listeners.forEach((listener) => listener(current));
}

export function validateThresholds({ hrMin, hrMax }: AlertThresholds): string | null {
  if (hrMin < HR_MIN_RANGE.min || hrMin > HR_MIN_RANGE.max) {
    return `Minimum must be between ${HR_MIN_RANGE.min} and ${HR_MIN_RANGE.max} BPM.`;
  }
  if (hrMax < HR_MAX_RANGE.min || hrMax > HR_MAX_RANGE.max) {
    return `Maximum must be between ${HR_MAX_RANGE.min} and ${HR_MAX_RANGE.max} BPM.`;
  }
  if (hrMax - hrMin < HR_MIN_GAP) {
    return `Maximum must be at least ${HR_MIN_GAP} BPM above minimum.`;
  }
  return null;
}
