import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { colors, fonts, layout, spacing, type } from '@/theme';
import {
  badgeLabel,
  badgeTier,
  lastConnectedText,
  lastSessionText,
  liveStats,
  statusText,
  totalStats,
} from './deviceFormat';
import type { TestedDevice } from './deviceModel';
import { DeviceSignal } from './DeviceSignal';
import { StatGrid } from './StatGrid';

type Props = {
  device: TestedDevice;
  now: number;
  // Bluetooth off or not allowed: Connect can't work.
  bluetoothBlocked: boolean;
  onOpen: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onForget: () => void;
};

export function DeviceCard({ device, now, bluetoothBlocked, onOpen, onConnect, onDisconnect, onForget }: Props) {
  const idle = device.status === 'disconnected';
  const connected = device.status === 'connected';
  const busy = !idle && !connected;
  const items = idle ? totalStats(device) : liveStats(device, now);
  const statusLine = idle ? lastConnectedText(device, now) : statusText(device.status, device.attempt);
  const lastSession = idle ? lastSessionText(device) : null;
  const badge = device.badge ? badgeLabel[device.badge] : null;

  const a11y = [
    device.name,
    statusLine,
    badge,
    device.error,
    ...items.map((i) => `${i.label} ${i.value}`),
    lastSession ? `Last session ${lastSession}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Card padding={0}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        accessibilityHint="Opens reliability, data quality and session history"
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <View style={styles.head}>
          <View style={styles.title}>
            <Text style={[type.subheading, styles.name]} numberOfLines={2}>
              {device.name}
            </Text>
            <Text style={[type.label, connected ? styles.connected : idle ? styles.muted : styles.pending]}>
              {connected ? '● ' : ''}
              {statusLine}
            </Text>
          </View>
          {device.badge && badge ? <Pill label={badge} tier={badgeTier[device.badge]} dot /> : null}
          <Feather name="chevron-right" size={layout.icon.action} color={colors.textMuted} />
        </View>

        <DeviceSignal rssi={device.rssi} battery={device.battery} lastKnown={idle} />
        {device.error && idle ? <Text style={[type.caption, styles.error]}>{device.error}</Text> : null}
        {device.paused ? <Text style={[type.caption, styles.pending]}>Readings paused (testing)</Text> : null}

        <StatGrid items={items} />

        {lastSession ? (
          <Text style={[type.caption, styles.muted]}>
            <Text style={styles.strong}>Last session: </Text>
            {lastSession}
          </Text>
        ) : null}
      </Pressable>

      <View style={styles.actions}>
        {idle ? (
          <Button
            label="Connect"
            icon="bluetooth"
            size="sm"
            onPress={onConnect}
            disabled={bluetoothBlocked}
            style={styles.action}
          />
        ) : (
          <Button
            label={busy && device.status !== 'disconnecting' ? 'Cancel' : 'Disconnect'}
            size="sm"
            variant="secondary"
            onPress={onDisconnect}
            disabled={device.status === 'disconnecting'}
            style={styles.action}
          />
        )}
        <Button label="Forget" size="sm" variant="destructive" onPress={onForget} style={styles.action} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.xl, gap: spacing.md },
  pressed: { backgroundColor: colors.surfaceSunken },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, gap: 2 },
  name: { color: colors.text },
  connected: { color: colors.good },
  pending: { color: colors.accentText },
  muted: { color: colors.textMuted },
  strong: { color: colors.textSecondary, fontFamily: fonts.uiSemiBold },
  error: { color: colors.danger },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    minHeight: layout.minTouch + spacing.md,
    alignItems: 'center',
  },
  action: { minWidth: layout.minTouch * 2 },
});
