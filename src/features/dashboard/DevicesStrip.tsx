import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SignalBars } from '@/components/ui/SignalBars';
import { signalFor } from '@/features/devices/bluetoothText';
import { colors, layout, radius, spacing, type } from '@/theme';
import type { DashboardDevice } from './dashboardModel';

type Props = {
  devices: DashboardDevice[];
  onOpenDevices: (deviceId?: string) => void;
};

export function DevicesStrip({ devices, onOpenDevices }: Props) {
  return (
    <Card padding={0} style={styles.card}>
      <View style={styles.head}>
        <Text style={[type.label, styles.title]} accessibilityRole="header">
          CONNECTED DEVICES
        </Text>
        {devices.length ? <Text style={[type.label, styles.count]}>{devices.length}</Text> : null}
      </View>

      {devices.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.dot, styles.dotIdle]} />
          <Text style={[type.bodyStrong, styles.emptyText]}>No device connected</Text>
          <Button label="Add device" icon="plus" variant="secondary" size="sm" onPress={() => onOpenDevices()} />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {devices.map((device) => (
            <DeviceChip key={device.deviceId} device={device} onPress={() => onOpenDevices(device.deviceId)} />
          ))}
        </ScrollView>
      )}
    </Card>
  );
}

function DeviceChip({ device, onPress }: { device: DashboardDevice; onPress: () => void }) {
  const connected = device.status === 'connected';
  const signal = device.rssi !== null ? signalFor(device.rssi) : null;
  const state = connected ? 'Connected' : device.status === 'disconnecting' ? 'Disconnecting' : 'Connecting';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${device.name}, ${state}${signal ? `, ${signal.label}` : ''}`}
      accessibilityHint="Opens this device in the Devices tab"
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <View style={[styles.dot, connected ? styles.dotOn : styles.dotPending]} />
      <View>
        <Text style={[type.bodyStrong, styles.name]} numberOfLines={1}>
          {device.name}
        </Text>
        {!connected ? <Text style={[type.caption, styles.muted]}>{state}…</Text> : null}
      </View>
      {signal ? <SignalBars bars={signal.bars} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.xl, paddingBottom: spacing.md },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { color: colors.textMuted, letterSpacing: 0.6 },
  count: { color: colors.accentText },
  empty: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  emptyText: { flex: 1, color: colors.textSecondary },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.minTouch,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceSunken },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: radius.pill },
  dotOn: { backgroundColor: colors.online },
  dotPending: { backgroundColor: colors.accent },
  dotIdle: { backgroundColor: colors.border },
  name: { color: colors.text, maxWidth: 160 },
  muted: { color: colors.textMuted },
});
