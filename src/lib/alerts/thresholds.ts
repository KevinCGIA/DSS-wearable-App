import type { AlertThresholds } from '@/data/types';
import { DEFAULT_ALERT_THRESHOLDS } from './thresholdsCore';
export {
  DEFAULT_ALERT_THRESHOLDS,
  HR_MAX_RANGE,
  HR_MIN_GAP,
  HR_MIN_RANGE,
  thresholdsFromDocument,
  validateThresholds,
} from './thresholdsCore';

// In-memory stand-in for users/{uid}/settings/alerts (Phase 2, CLAUDE.md step 6).
// Same subscribe/save shape as Android's Firestore helpers, so Phase 2 swaps only this file.

let current: AlertThresholds = { ...DEFAULT_ALERT_THRESHOLDS };
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

export const getAlertThresholdsUid = () => 'preview-user';
