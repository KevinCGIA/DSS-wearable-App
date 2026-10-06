import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import type { AlertItem } from '@/data/types';

type Listener = (alerts: AlertItem[]) => void;
const states = new Map<string, { alerts: AlertItem[]; ready: Promise<void>; writes: Promise<void>; listeners: Set<Listener> }>();
const key = (uid: string) => `dss:alert-history:v1:${uid}`;
const owns = (uid: string) => getAuth().currentUser?.uid === uid;

function state(uid: string) {
  let entry = states.get(uid);
  if (entry) return entry;
  entry = { alerts: [], ready: Promise.resolve(), writes: Promise.resolve(), listeners: new Set() };
  const current = entry;
  current.ready = AsyncStorage.getItem(key(uid)).then((json) => {
    if (json) {
      const parsed: unknown = JSON.parse(json);
      if (Array.isArray(parsed)) current.alerts = parsed.filter((item) => item && typeof item.id === 'string' && typeof item.timestamp === 'number').slice(0, 200);
    }
    if (owns(uid)) current.listeners.forEach((listener) => listener(current.alerts));
  });
  states.set(uid, current);
  return current;
}

export function subscribeToAlerts(uid: string, onAlerts: Listener, onError: (error: Error) => void) {
  if (!owns(uid)) { queueMicrotask(() => onError(new Error('Alert history belongs to a different account.'))); return () => undefined; }
  const entry = state(uid);
  entry.listeners.add(onAlerts);
  void entry.ready.then(() => { if (owns(uid)) onAlerts(entry.alerts); }).catch(onError);
  return () => entry.listeners.delete(onAlerts);
}

function change(uid: string, next: (alerts: AlertItem[]) => AlertItem[]) {
  if (!owns(uid)) return Promise.reject(new Error('Alert history belongs to a different account.'));
  const entry = state(uid);
  const write = entry.writes.catch(() => undefined).then(async () => {
    await entry.ready;
    if (!owns(uid)) return;
    const alerts = next(entry.alerts);
    await AsyncStorage.setItem(key(uid), JSON.stringify(alerts));
    entry.alerts = alerts;
    entry.listeners.forEach((listener) => listener(alerts));
  });
  entry.writes = write;
  return write;
}

export function addAlert(uid: string, alert: Omit<AlertItem, 'id'>) {
  return change(uid, (alerts) => [{ ...alert, id: `${alert.timestamp}-${Math.random().toString(36).slice(2)}` }, ...alerts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 200));
}

export function clearAlerts(uid: string) { return change(uid, () => []); }
