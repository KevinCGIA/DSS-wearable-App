import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import type { DailyActivityExtras } from '@/data/types';
import { colors, layout, radius, spacing, type } from '@/theme';
import type { DeviceTone, DeviceView } from './homeModel';

type Props = {
  device: DeviceView;
  refreshing: boolean;
  stepsToday: number;
  activity: DailyActivityExtras;
  onRefresh: () => void;
  onOpenDevices: () => void;
  onOpenFitness: () => void;
};

const ringTones: Record<DeviceTone, { border: string; fill: string; icon: string; status: string }> = {
  idle: { border: colors.border, fill: colors.surfaceSunken, icon: colors.textMuted, status: colors.textMuted },
  active: { border: colors.accent, fill: colors.accentSurface, icon: colors.accent, status: colors.good },
  pending: { border: colors.accentBorder, fill: colors.accentSurface, icon: colors.accentText, status: colors.accentText },
  failed: { border: colors.danger, fill: colors.dangerSurface, icon: colors.danger, status: colors.danger },
};

export function DeviceActivityCard({
  device,
  refreshing,
  stepsToday,
  activity,
  onRefresh,
  onOpenDevices,
  onOpenFitness,
}: Props) {
  const tone = ringTones[device.tone];
  const statusLine = device.status
    ? `${device.status}${device.battery !== null ? ` · ${device.battery}%` : ''}`
    : null;
  const canSync = device.tone === 'active' || device.tone === 'failed';

  return (
    <Card padding={0} style={styles.card}>
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
          onPress={onOpenFitness}
          style={({ pressed }) => [styles.activity, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Today's activity: ${stepsToday} steps. Open Fitness`}
        >
          <Text style={[type.caption, styles.eyebrow]}>TODAY'S ACTIVITY</Text>
          <ActivityRow label="Steps" value={stepsToday.toLocaleString()} />
          <ActivityRow
            label="Distance"
            value={activity.distanceKm !== null ? activity.distanceKm.toFixed(1) : '--'}
            unit={activity.distanceKm !== null ? 'km' : undefined}
          />
          <ActivityRow label="Floors" value={activity.floors !== null ? String(activity.floors) : '--'} />
        </Pressable>
      </View>
    </Card>
  );
}

function ActivityRow({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.row}>
      <Text style={[type.body, styles.rowLabel]}>{label}</Text>
      <Text style={[type.statSmall, styles.rowValue]} numberOfLines={1}>
        {value}
        {unit ? <Text style={[type.caption, styles.rowUnit]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg, overflow: 'hidden' },
  columns: { flexDirection: 'row' },
  pressed: { backgroundColor: colors.surfaceSunken },
  deviceColumn: { flex: 1, paddingBottom: spacing.md },
  device: { alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
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
  activity: { flex: 1.15, padding: spacing.lg, justifyContent: 'center' },
  eyebrow: { color: colors.textMuted, letterSpacing: 0.8, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowLabel: { color: colors.textSecondary, marginRight: spacing.sm },
  rowValue: { color: colors.text, textAlign: 'right', flexShrink: 1 },
  rowUnit: { color: colors.textMuted },
});
