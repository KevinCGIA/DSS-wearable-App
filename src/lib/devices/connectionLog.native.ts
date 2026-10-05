import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConnectionEvent } from './connectionLog';
import { boundedEvents, resumeConnectionLog, type SavedConnectionLog } from './connectionLogCore';
import { withDeadline } from '../asyncDeadline';

export type { ConnectionEvent, ConnectionEventType } from './connectionLog';
type NewEvent = Omit<ConnectionEvent, 'id' | 'timestamp'> & { timestamp?: number };
type Session = { uid: string; events: ConnectionEvent[]; ready: boolean; active: boolean; foreground: boolean; updatedAt: number; saving: Promise<void>; onError: (message: string) => void };
let current: Session | null = null;
let nextId = 0;
const closing = new Map<string, Promise<void>>();
const listeners = new Set<(events: ConnectionEvent[]) => void>();
const errorListeners = new Set<(error: string | null) => void>();
let error: string | null = null;
const id = () => `event-${Date.now()}-${++nextId}`;
const notify = () => listeners.forEach((listener) => listener(current?.events ?? []));
const notifyError = () => errorListeners.forEach((listener) => listener(error));
const keyOf = (uid: string) => `dss:connection-log:v1:${uid}`;

function save(session: Session) {
  if (!session.ready) return Promise.resolve();
  const snapshot: SavedConnectionLog = { events: session.events, updatedAt: session.updatedAt, foreground: session.foreground };
  session.saving = session.saving.catch(() => undefined).then(() => AsyncStorage.setItem(keyOf(session.uid), JSON.stringify(snapshot))).catch(() => {
    error = "Couldn't save connection history on this phone."; notifyError(); session.onError(error);
  });
  return session.saving;
}

export function logConnectionEvent(event: NewEvent) {
  const session = current;
  if (!session?.active) return;
  const timestamp = event.timestamp ?? Date.now();
  session.events = boundedEvents([...session.events, { ...event, id: id(), timestamp }], Date.now());
  session.updatedAt = Date.now();
  if (event.type === 'app_background') session.foreground = false;
  if (event.type === 'app_foreground') session.foreground = true;
  notify();
  void save(session);
}

export function startConnectionLog(uid: string, onError: (message: string) => void) {
  const session: Session = { uid, events: [], active: true, ready: false, foreground: AppState.currentState === 'active', updatedAt: Date.now(), saving: Promise.resolve(), onError };
  current = session; error = null; notify(); notifyError();
  const loading = (async () => {
    await closing.get(uid);
    const raw = await withDeadline(AsyncStorage.getItem(keyOf(uid)));
    const saved = raw ? JSON.parse(raw) as SavedConnectionLog : null;
    if (saved && (!Array.isArray(saved.events) || typeof saved.updatedAt !== 'number')) throw new Error('Saved connection history is invalid.');
    const now = Date.now();
    session.events = boundedEvents([...resumeConnectionLog(saved, now, id), ...session.events], now);
    session.updatedAt = now;
    session.ready = true;
    if (session.active && current === session) notify();
    await save(session);
  })().catch((cause) => {
    if (!session.active) return;
    error = cause instanceof Error ? cause.message : "Couldn't load connection history.";
    notifyError(); onError(error);
  });
  const app = AppState.addEventListener('change', (state) => {
    if (!session.active || current !== session) return;
    if (state === 'background' || state === 'inactive') {
      if (session.foreground) logConnectionEvent({ type: 'app_background', deviceId: null });
    } else if (state === 'active' && !session.foreground) logConnectionEvent({ type: 'app_foreground', deviceId: null });
  });
  const heartbeat = setInterval(() => {
    if (session.active && session.foreground) { session.updatedAt = Date.now(); void save(session); }
  }, 30000);
  return () => {
    if (session.foreground) logConnectionEvent({ type: 'app_background', deviceId: null });
    session.active = false; app.remove(); clearInterval(heartbeat);
    const closed = loading.then(() => save(session)).catch(() => undefined);
    closing.set(uid, closed);
    if (current === session) { current = null; notify(); }
  };
}

export function subscribeToConnectionLog(onEvents: (events: ConnectionEvent[]) => void) {
  listeners.add(onEvents); onEvents(current?.events ?? []);
  return () => { listeners.delete(onEvents); };
}

export function useConnectionLog(): ConnectionEvent[] {
  const [events, setEvents] = useState<ConnectionEvent[]>(current?.events ?? []);
  useEffect(() => subscribeToConnectionLog(setEvents), []);
  return events;
}

export function useConnectionLogError(): string | null {
  const [value, setValue] = useState(error);
  useEffect(() => { errorListeners.add(setValue); setValue(error); return () => { errorListeners.delete(setValue); }; }, []);
  return value;
}
