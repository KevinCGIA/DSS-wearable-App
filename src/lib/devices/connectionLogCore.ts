import type { ConnectionEvent } from './connectionLog';

export const MAX_CONNECTION_EVENTS = 1000;
export const CONNECTION_HISTORY_MS = 30 * 86400000;
export type SavedConnectionLog = { events: ConnectionEvent[]; updatedAt: number; foreground: boolean };

export function boundedEvents(events: ConnectionEvent[], now: number): ConnectionEvent[] {
  return events.filter((event) => event.timestamp >= now - CONNECTION_HISTORY_MS && event.timestamp <= now + 60000)
    .sort((a, b) => a.timestamp - b.timestamp).slice(-MAX_CONNECTION_EVENTS);
}

// A process stop has no callback. Close any previously open foreground span at
// the last persisted heartbeat, then mark this launch as foreground.
export function resumeConnectionLog(saved: SavedConnectionLog | null, now: number, id: () => string): ConnectionEvent[] {
  const events = boundedEvents(saved?.events ?? [], now);
  if (!saved) return events;
  const lastBackground = [...events].reverse().find((event) => event.type === 'app_background' || event.type === 'app_foreground');
  if (saved.foreground && lastBackground?.type !== 'app_background') {
    events.push({ id: id(), type: 'app_background', deviceId: null, timestamp: Math.min(now, Math.max(saved.updatedAt, events.at(-1)?.timestamp ?? 0)) });
  }
  if (lastBackground?.type === 'app_background' || saved.foreground) {
    events.push({ id: id(), type: 'app_foreground', deviceId: null, timestamp: now });
  }
  return boundedEvents(events, now);
}
