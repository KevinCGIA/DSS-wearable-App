import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CardLink } from '@/components/ui/CardLink';
import { ExpandableCard, toggleA11y } from '@/components/ui/ExpandableCard';
import { ExpandChevron } from '@/components/ui/ExpandChevron';
import { IconButton } from '@/components/ui/IconButton';
import { SignalBars } from '@/components/ui/SignalBars';
import { TimeBarChart } from '@/components/ui/TimeBarChart';
import type { DailyActivityExtras, HistoryState } from '@/data/types';
import { signalFor } from '@/features/devices/bluetoothText';
import { formatAge } from '@/lib/time';
import { HOUR_MS, stepsByBucketAcrossDevices } from '@/lib/trends';
import { distanceFor, unitLabels } from '@/lib/measures';
import type { Units } from '@/lib/measures';
import { colors, layout, radius, spacing, type } from '@/theme';
import { statusLabel } from './dashboardModel';
import type { DeviceSummary, DeviceTone, DeviceView } from './dashboardModel';

type Props = {
  device: DeviceView;
  devices: DeviceSummary[];
  stepsHistory: HistoryState;
  stepsUpdatedAt: number | null;
  now: number;
  initiallyExpanded?: boolean;
  refreshing: boolean;
  stepsToday: number;
  activity: DailyActivityExtras;
  units: Units;
  onRefresh: () => void;
  onOpenDevices: () => void;
  onOpenSteps: () => void;
};

const ringTones: Record<DeviceTone, { border: string; fill: string; icon: string; status: string }> = {
  idle: { border: colors.border, fill: colors.surfaceSunken, icon: colors.textMuted, status: colors.textMuted },
  active: { border: colors.accent, fill: colors.accentSurface, icon: colors.accent, status: colors.good },
  pending: { border: colors.accentBorder, fill: colors.accentSurface, icon: colors.accentText, status: colors.accentText },
  failed: { border: colors.danger, fill: colors.dangerSurface, icon: colors.danger, status: colors.danger },
};

export function DeviceActivityCard({
  device,
  devices,
  stepsHistory,
  stepsUpdatedAt,
  now,
  initiallyExpanded,
  refreshing,
  stepsToday,
  activity,
  units,
  onRefresh,
  onOpenDevices,
  onOpenSteps,
}: Props) {
  const tone = ringTones[device.tone];
  const statusLine = device.status
    ? `${device.status}${device.battery !== null ? ` · ${device.battery}%` : ''}`
    : null;
  const distance = distanceFor(units, activity.distanceKm);
  const canSync = device.tone === 'active' || device.tone === 'failed';

  return (
    <ExpandableCard
      padding={0}
      style={styles.card}
      pressableHeader={false}
      initiallyExpanded={initiallyExpanded}
      header={({ expanded, toggle }) => (
        <View style={styles.columns}>
          <View style={styles.deviceColumn}>
            <Pressable
              onPress={onOpenDevices}
              style={({ pressed }) => [styles.device, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={[device.name, statusLine, canSync ? null : device.hint]
                .filter(Boolean)
                .join(', ')}
              accessibilityHint="Opens Devices"
            >
              <View style={[styles.ring, { borderColor: tone.border, backgroundColor: tone.fill }]}>
                <Feather name="watch" size={30} color={tone.icon} />
              </View>
              <Text style={[type.subheading, styles.name]} numberOfLines={2}>
                {device.name}
              </Text>
              {statusLine ? (
                <Text style={[type.label, styles.status, { color: tone.status }]}>{statusLine}</Text>
              ) : null}
              {device.hint && !canSync ? <Text style={[type.caption, styles.hint]}>{device.hint}</Text> : null}
            </Pressable>
            {canSync ? (
              <View style={styles.syncRow}>
                <IconButton
                  icon="refresh-cw"
                  spinning={refreshing}
                  onPress={onRefresh}
                  accessibilityLabel={
                    device.tone === 'failed' ? 'Retry connection' : refreshing ? 'Syncing device' : 'Sync device'
                  }
                />
                {device.hint ? <Text style={[type.caption, styles.syncText]}>{device.hint}</Text> : null}
              </View>
            ) : null}
          </View>

          <View style={styles.divider} />

          <Pressable
            onPress={toggle}
            style={({ pressed }) => [styles.activity, pressed && styles.pressed]}
            accessibilityLabel={`Today's activity: ${stepsToday} steps`}
            {...toggleA11y(expanded)}
          >
            <View style={styles.eyebrowRow}>
              <Text style={[type.overline, styles.eyebrow]}>TODAY'S ACTIVITY</Text>
              <ExpandChevron expanded={expanded} />
            </View>
            <ActivityRow label="Steps" value={stepsToday.toLocaleString()} />
            <ActivityRow
              label="Distance"
              value={distance !== null ? distance.toFixed(1) : '--'}
              unit={distance !== null ? unitLabels(units).distance : undefined}
            />
            <ActivityRow label="Floors" value={activity.floors !== null ? String(activity.floors) : '--'} />
          </Pressable>
        </View>
      )}
    >
      <View style={styles.expanded}>
        <Text style={[type.overline, styles.section]}>DEVICES</Text>
        {devices.length === 0 ? (
          <>
            <Text style={[type.body, styles.muted]}>No device connected</Text>
            <CardLink label="Add device ›" onPress={onOpenDevices} />
          </>
        ) : (
          devices.map((d) => <DeviceRow key={d.deviceId} device={d} now={now} />)
        )}

        <Text style={[type.overline, styles.section]}>TODAY</Text>
        <TodaySteps history={stepsHistory} now={now} />
        <Text style={[type.caption, styles.muted]}>
          {stepsUpdatedAt ? `Steps updated ${formatAge(now - stepsUpdatedAt)}` : 'No steps recorded yet'}
        </Text>

        <View style={styles.links}>
          <CardLink label="Devices ›" onPress={onOpenDevices} />
          <CardLink label="Open in Activity ›" hint="Opens Steps in the Activity tab" onPress={onOpenSteps} />
        </View>
      </View>
    </ExpandableCard>
  );
}

function DeviceRow({ device, now }: { device: DeviceSummary; now: number }) {
  const signal = device.rssi !== null ? signalFor(device.rssi) : null;
  const battery = device.batteryLevel !== null ? `Battery ${device.batteryLevel}%` : 'Battery not reported';
  const sync = device.lastSync ? `Last sync ${formatAge(now - device.lastSync)}` : 'No readings yet';
  return (
    <View
      style={styles.deviceRow}
      accessible
      accessibilityLabel={[device.name, statusLabel(device.status), signal ? `${signal.label}, ${device.rssi} dBm` : null, battery, sync]
        .filter(Boolean)
        .join(', ')}
    >
      <Text style={[type.bodyStrong, styles.deviceName]}>{device.name}</Text>
      <View style={styles.meta}>
        {signal ? (
          <View style={styles.metaItem}>
            <SignalBars bars={signal.bars} />
            <Text style={[type.caption, styles.muted]}>{device.rssi} dBm</Text>
          </View>
        ) : null}
        <Text style={[type.caption, styles.muted]}>{battery}</Text>
        <Text style={[type.caption, device.status === 'connected' ? styles.good : styles.pending]}>
          {statusLabel(device.status)}
        </Text>
        <Text style={[type.caption, styles.muted]}>{sync}</Text>
      </View>
    </View>
  );
}

// Steps per hour since midnight, summed per device (running totals are per device).
function TodaySteps({ history, now }: { history: HistoryState; now: number }) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const start = midnight.getTime();
  const buckets = stepsByBucketAcrossDevices(history.readings, start, Math.max(now, start + HOUR_MS), HOUR_MS);
  const total = Math.round(buckets.reduce((s, b) => s + (b.value ?? 0), 0));
  if (total === 0) return <Text style={[type.body, styles.muted]}>No steps per hour to show yet today.</Text>;
  return (
    <TimeBarChart
      buckets={buckets}
      start={start}
      end={Math.max(now, start + HOUR_MS)}
      height={layout.miniChartHeight}
      accessibilityLabel={`Steps per hour today, ${total} in total`}
    />
  );
}

function ActivityRow({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.row}>
      <Text style={[type.body, styles.rowLabel]}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={[type.statSmall, styles.rowValue]}>{value}</Text>
        {unit ? <Text style={[type.unit, styles.rowUnit]}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg, overflow: 'hidden' },
  columns: { flexDirection: 'row' },
  pressed: { backgroundColor: colors.surfaceSunken },
  deviceColumn: { flex: 1, paddingBottom: spacing.md },
  device: { alignItems: 'center', padding: spacing.xl, paddingBottom: spacing.sm },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  syncText: { color: colors.textMuted, flexShrink: 1 },
  ring: {
    width: layout.deviceRing,
    height: layout.deviceRing,
    borderRadius: radius.pill,
    borderWidth: layout.deviceRingBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.text, textAlign: 'center', marginTop: spacing.md },
  status: { textAlign: 'center', marginTop: spacing.xs, letterSpacing: 0.6 },
  hint: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.lg },
  activity: { flex: 1.15, padding: spacing.xl, justifyContent: 'center' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  eyebrow: { color: colors.textMuted, textAlign: 'center' },
  expanded: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  section: { color: colors.textMuted, marginTop: spacing.xs },
  muted: { color: colors.textMuted },
  good: { color: colors.good },
  pending: { color: colors.accentText },
  deviceRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  deviceName: { color: colors.text },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.md, rowGap: spacing.xs, marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowLabel: { color: colors.textSecondary, marginRight: spacing.sm },
  rowRight: { flexDirection: 'row', alignItems: 'baseline', flexShrink: 1 },
  rowValue: { color: colors.text, textAlign: 'right', flexShrink: 1 },
  rowUnit: { color: colors.textMuted, marginLeft: spacing.xs },
});
