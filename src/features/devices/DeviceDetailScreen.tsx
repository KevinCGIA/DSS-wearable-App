import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import type { BluetoothState } from '@/data/types';
import type { Session } from '@/lib/devices/deviceStats';
import { formatDurationMs } from '@/lib/devices/deviceStats';
import { formatAge } from '@/lib/time';
import { colors, spacing, type } from '@/theme';
import { bluetoothProblem } from './bluetoothText';
import {
  badgeHint,
  badgeLabel,
  badgeTier,
  formatBpm,
  formatConnectTime,
  formatCount,
  formatDateTime,
  formatRate,
  lastConnectedText,
  liveStats,
  NO_VALUE,
  sessionEndLabel,
  statusText,
} from './deviceFormat';
import type { TestedDevice } from './deviceModel';
import { DeviceSignal } from './DeviceSignal';
import { StatGrid } from './StatGrid';

// Mock Bluetooth only (dev builds): exercise the drop-out and Not responding paths.
export type DeviceTestTools = {
  onSimulateDropOut: () => void;
  onTogglePause: () => void;
};

export type DeviceDetailScreenProps = {
  now: number;
  device: TestedDevice | null;
  bluetoothState: BluetoothState;
  testTools?: DeviceTestTools;
  onBack: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onForget: () => void;
};

export function DeviceDetailScreen({
  now,
  device,
  bluetoothState,
  testTools,
  onBack,
  onConnect,
  onDisconnect,
  onForget,
}: DeviceDetailScreenProps) {
  if (!device) {
    return (
      <Screen scroll hero={<HeroHeader title="Device" onBack={onBack} />}>
        <Card style={styles.first}>
          <EmptyState icon="watch" title="Device not found" message="It may have been forgotten." />
        </Card>
      </Screen>
    );
  }

  const { stats } = device;
  const idle = device.status === 'disconnected';
  const connected = device.status === 'connected';
  const busy = !idle && !connected;
  const problem = bluetoothProblem(bluetoothState);
  const subtitle = idle ? lastConnectedText(device, now) : statusText(device.status, device.attempt);

  return (
    <Screen scroll hero={<HeroHeader title={device.name} subtitle={subtitle} onBack={onBack} />}>
      <Card style={styles.first}>
        <View style={styles.statusRow}>
          {device.badge ? (
            <Pill label={badgeLabel[device.badge]} tier={badgeTier[device.badge]} dot />
          ) : (
            <Pill label="Not enough data" />
          )}
          <Text style={[type.label, connected ? styles.connected : styles.muted]} accessibilityLiveRegion="polite">
            {statusText(device.status, device.attempt)}
          </Text>
        </View>
        {device.badge ? <Text style={[type.caption, styles.muted]}>{badgeHint[device.badge]}</Text> : null}
        <DeviceSignal rssi={device.rssi} battery={device.battery} lastKnown={idle} />
        {device.error && idle ? <Text style={[type.caption, styles.error]}>{device.error}</Text> : null}
        {problem ? <ErrorBanner message={problem} tone="warning" /> : null}
        <View style={styles.actions}>
          {idle ? (
            <Button label="Connect" icon="bluetooth" size="md" onPress={onConnect} disabled={Boolean(problem)} />
          ) : (
            <Button
              label={busy && device.status !== 'disconnecting' ? 'Cancel' : 'Disconnect'}
              size="md"
              variant="secondary"
              onPress={onDisconnect}
              disabled={device.status === 'disconnecting'}
            />
          )}
          <Button label="Forget" size="md" variant="destructive" onPress={onForget} />
        </View>
      </Card>

      {!idle ? (
        <>
          <Section title="Right now" />
          <Card>
            <StatGrid items={liveStats(device, now)} />
          </Card>
        </>
      ) : null}

      <Section title="Totals" />
      <Card>
        <StatGrid
          columns={2}
          items={[
            { label: 'Sessions', value: formatCount(stats.totalSessions) },
            { label: 'Connected time', value: formatDurationMs(stats.connectedMs) },
            { label: 'Readings', value: formatCount(stats.totalReadings) },
            { label: 'Avg BPM', value: formatBpm(stats.avgBpm) },
          ]}
        />
      </Card>

      <Section title="Reliability" />
      <Card>
        <StatGrid
          columns={2}
          items={[
            { label: 'Success rate', value: formatRate(stats.successRate) },
            { label: 'Avg time to connect', value: formatConnectTime(stats.avgConnectMs) },
            { label: 'Drop-outs', value: formatCount(stats.dropOuts) },
            { label: 'Reconnect attempts', value: formatCount(stats.reconnects) },
          ]}
        />
      </Card>

      <Section title="Data quality" />
      <Card>
        <StatGrid
          columns={2}
          items={[
            {
              label: 'Readings per minute',
              value: stats.readingsPerMin === null ? NO_VALUE : stats.readingsPerMin.toFixed(1),
            },
            { label: 'Gaps over 30 s', value: formatCount(stats.gaps) },
            {
              label: 'Last reading',
              value: stats.lastReadingAt === null ? NO_VALUE : formatAge(now - stats.lastReadingAt),
            },
            { label: 'Readings today', value: formatCount(stats.readingsToday) },
          ]}
        />
        <Text style={[type.caption, styles.muted, styles.note]}>
          Time with the app in the background or closed doesn't count as a gap or drop-out.
        </Text>
      </Card>

      {testTools && connected ? (
        <>
          <Section title="Testing tools" />
          <Card>
            <Text style={[type.caption, styles.muted]}>
              Simulated Bluetooth only. Pausing for over a minute shows Not responding.
            </Text>
            <View style={styles.actions}>
              <Button label="Simulate drop-out" size="md" variant="secondary" onPress={testTools.onSimulateDropOut} />
              <Button
                label={device.paused ? 'Resume readings' : 'Pause readings'}
                size="md"
                variant="secondary"
                onPress={testTools.onTogglePause}
              />
            </View>
          </Card>
        </>
      ) : null}

      <Section title={`Session history (${stats.totalSessions})`} />
      <Card padding={0}>
        {stats.sessions.length === 0 ? (
          <Text style={[type.body, styles.muted, styles.empty]}>No sessions yet.</Text>
        ) : (
          stats.sessions.map((session, index) => (
            <SessionRow key={session.start} session={session} divider={index > 0} />
          ))
        )}
      </Card>
    </Screen>
  );
}

function SessionRow({ session, divider }: { session: Session; divider: boolean }) {
  const ended = sessionEndLabel(session.endedBy);
  const detail = `${formatCount(session.readings)} readings · avg ${formatBpm(session.avgBpm)} BPM`;
  const dropped = session.endedBy === 'unexpected';
  return (
    <View
      style={[styles.session, divider && styles.divider]}
      accessible
      accessibilityLabel={`${formatDateTime(session.start)}, ${formatDurationMs(session.durationMs)}, ${detail}, ${ended}`}
    >
      <View style={styles.sessionTop}>
        <Text style={[type.bodyStrong, styles.text]}>{formatDateTime(session.start)}</Text>
        <Text style={[type.bodyStrong, styles.text]}>{formatDurationMs(session.durationMs)}</Text>
      </View>
      <Text style={[type.caption, styles.muted]}>
        {detail} · <Text style={dropped ? styles.error : undefined}>{ended}</Text>
      </Text>
    </View>
  );
}

function Section({ title }: { title: string }) {
  return (
    <Text style={[type.label, styles.section]} accessibilityRole="header">
      {title.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: spacing.xl, gap: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md },
  connected: { color: colors.good },
  muted: { color: colors.textMuted },
  text: { color: colors.text, flexShrink: 1 },
  error: { color: colors.danger },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  section: {
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  note: { marginTop: spacing.md },
  empty: { padding: spacing.xl, textAlign: 'center' },
  session: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 2 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
});
