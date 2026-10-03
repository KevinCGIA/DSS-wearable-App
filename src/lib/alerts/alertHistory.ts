import type { AlertItem } from '@/data/types';

// In-memory stand-in for the alert history the Phase 2 alert engine writes (e.g. users/{uid}/alerts).
// Same subscribe/add shape as Android's Firestore helpers, so Phase 2 swaps only this file.

let alerts: AlertItem[] = [];
const listeners = new Set<(alerts: AlertItem[]) => void>();
let nextId = 1;

const emit = () => listeners.forEach((listener) => listener(alerts));

// Newest first. Returns an unsubscribe function.
export function subscribeToAlerts(
  _uid: string,
  onAlerts: (alerts: AlertItem[]) => void,
  _onError: (error: Error) => void,
): () => void {
  listeners.add(onAlerts);
  const timer = setTimeout(() => onAlerts(alerts), 300);
  return () => {
    clearTimeout(timer);
    listeners.delete(onAlerts);
  };
}

export async function addAlert(_uid: string, alert: Omit<AlertItem, 'id'>): Promise<void> {
  alerts = [{ ...alert, id: `a${nextId++}` }, ...alerts].sort((a, b) => b.timestamp - a.timestamp);
  emit();
}

export async function clearAlerts(_uid: string): Promise<void> {
  alerts = [];
  emit();
}
