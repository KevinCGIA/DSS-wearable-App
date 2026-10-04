import type { ConnectionStatus } from '@/data/types';
import type { HealthBadge, SessionEnd } from '@/lib/devices/deviceStats';
import { formatDurationMs } from '@/lib/devices/deviceStats';
import { formatAge, formatShortDate } from '@/lib/time';
import { currentSession } from './deviceModel';
import type { TestedDevice } from './deviceModel';

export const NO_VALUE = '--';

export type StatItem = { label: string; value: string };

export const formatRate = (rate: number | null) => (rate === null ? NO_VALUE : `${Math.round(rate * 100)}%`);
export const formatBpm = (bpm: number | null) => (bpm === null ? NO_VALUE : `${Math.round(bpm)}`);
export const formatCount = (n: number | null) => (n === null ? NO_VALUE : n.toLocaleString('en-US'));

export function formatConnectTime(ms: number | null): string {
  return ms === null ? NO_VALUE : `${(ms / 1000).toFixed(1)} s`;
}

export function formatDateTime(ms: number): string {
  const date = new Date(ms);
  return `${formatShortDate(date)}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export function statusText(status: ConnectionStatus, attempt: number): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return `Connecting (attempt ${attempt})…`;
    case 'reconnecting':
      return `Connection lost, reconnecting (attempt ${attempt})…`;
    case 'discovering':
      return 'Setting up device…';
    case 'disconnecting':
      return 'Disconnecting…';
    case 'disconnected':
      return 'Not connected';
  }
}

export const badgeLabel: Record<HealthBadge, string> = {
  stable: 'Stable',
  unstable: 'Unstable',
  not_responding: 'Not responding',
};

export const badgeTier = { stable: 'good', unstable: 'warning', not_responding: 'alert' } as const;

export const badgeHint: Record<HealthBadge, string> = {
  stable: 'Connects reliably and sends steady readings.',
  unstable: 'Fails to connect, drops out or has gaps in readings more often than it should.',
  not_responding: 'No readings for over a minute, or it rarely connects.',
};

export function sessionEndLabel(endedBy: SessionEnd): string {
  if (endedBy === 'ongoing') return 'Ongoing';
  return endedBy === 'user' ? 'Ended by you' : 'Dropped out';
}

export function batteryText(battery: number | null): string {
  return battery === null ? 'Battery not reported' : `Battery ${battery}%`;
}

export function lastConnectedText(device: TestedDevice, now: number): string {
  return device.lastConnectedAt === null ? 'Never connected' : `Last connected ${formatAge(now - device.lastConnectedAt)}`;
}

// Connected now: live numbers for the current session.
export function liveStats(device: TestedDevice, now: number): StatItem[] {
  const { stats } = device;
  const session = currentSession(device);
  return [
    { label: 'Current BPM', value: formatBpm(stats.currentBpm) },
    { label: '24 h avg BPM', value: formatBpm(stats.avg24hBpm) },
    { label: 'Steps today', value: formatCount(stats.stepsToday) },
    { label: 'Readings this session', value: session ? formatCount(session.readings) : NO_VALUE },
    { label: 'Session time', value: session ? formatDurationMs(session.durationMs) : NO_VALUE },
    { label: 'Last reading', value: stats.lastReadingAt === null ? NO_VALUE : formatAge(now - stats.lastReadingAt) },
  ];
}

// Previously connected: totals across every session.
export function totalStats(device: TestedDevice): StatItem[] {
  const { stats } = device;
  return [
    { label: 'Sessions', value: formatCount(stats.totalSessions) },
    { label: 'Connected time', value: formatDurationMs(stats.connectedMs) },
    { label: 'Readings', value: formatCount(stats.totalReadings) },
    { label: 'Avg BPM', value: formatBpm(stats.avgBpm) },
    { label: 'Success rate', value: formatRate(stats.successRate) },
    { label: 'Drop-outs', value: formatCount(stats.dropOuts) },
  ];
}

export function lastSessionText(device: TestedDevice): string | null {
  const last = device.stats.sessions.find((s) => s.endedBy !== 'ongoing');
  if (!last) return null;
  return `${formatDateTime(last.start)} · ${formatDurationMs(last.durationMs)} · ${formatCount(last.readings)} readings · ${sessionEndLabel(last.endedBy)}`;
}
