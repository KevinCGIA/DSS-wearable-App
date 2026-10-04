import { useEffect, useState } from 'react';

// In-memory connection event log (Phase 2 Step B 6b). It drives sessions, success rate, drop-outs
// and connected time. Phase 2: real BLE writes the same events, persisted under
// users/{uid}/devices/{key}/events (a new subcollection, so Android's docs are untouched).

export type ConnectionEventType =
  | 'connect_attempt'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'app_background'
  | 'app_foreground';

export type ConnectionEvent = {
  id: string;
  type: ConnectionEventType;
  // null for app background/foreground events
  deviceId: string | null;
  timestamp: number;
  // disconnected: who ended it
  reason?: 'user' | 'unexpected';
  // connect_attempt: 1-based attempt; auto = automatic reconnect after a drop
  attempt?: number;
  auto?: boolean;
  // connected: time from the first attempt to connected
  connectMs?: number;
};

let events: ConnectionEvent[] = [];
const listeners = new Set<(events: ConnectionEvent[]) => void>();
let nextId = 1;

const emit = () => listeners.forEach((listener) => listener(events));

export function logConnectionEvent(event: Omit<ConnectionEvent, 'id' | 'timestamp'> & { timestamp?: number }) {
  events = [...events, { ...event, id: `e${nextId++}`, timestamp: event.timestamp ?? Date.now() }].sort(
    (a, b) => a.timestamp - b.timestamp,
  );
  emit();
}

// Mock only: start the app with recorded history for previously connected devices.
export function seedConnectionLog(seed: Omit<ConnectionEvent, 'id'>[]) {
  events = [...events, ...seed.map((e) => ({ ...e, id: `e${nextId++}` }))].sort((a, b) => a.timestamp - b.timestamp);
  emit();
}

export function subscribeToConnectionLog(onEvents: (events: ConnectionEvent[]) => void): () => void {
  listeners.add(onEvents);
  onEvents(events);
  return () => {
    listeners.delete(onEvents);
  };
}

export function useConnectionLog(): ConnectionEvent[] {
  const [state, setState] = useState<ConnectionEvent[]>(events);
  useEffect(() => subscribeToConnectionLog(setState), []);
  return state;
}
