import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import type { ConnectionState } from '@/data/types';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  connection: ConnectionState;
  onDisconnect: () => void;
};

// Android: components/DeviceSettingsSection.tsx "Current device" card.
export function CurrentDevice({ connection, onDisconnect }: Props) {
  const { status, deviceName, batteryLevel, error } = connection;
  const connected = status === 'connected';
  const idle = status === 'disconnected';

  const statusText = connected
    ? `● Connected${batteryLevel !== null ? ` · ${batteryLevel}%` : ''}`
    : status === 'disconnecting'
      ? 'Disconnecting…'
      : status === 'discovering'
        ? 'Setting up device…'
        : status === 'reconnecting'
          ? `Reconnecting (attempt ${connection.attempt})…`
          : status === 'connecting'
            ? `Connecting (attempt ${connection.attempt})…`
            : null;

  return (
    <View style={styles.row}>
      <View style={[styles.badge, connected && styles.badgeOn]}>
        <Feather name="watch" size={18} color={connected ? colors.accent : colors.textMuted} />
      </View>
      <View style={styles.text}>
        <Text style={[type.caption, styles.label]}>Current device</Text>
        <Text style={[type.bodyStrong, styles.name]} numberOfLines={1}>
          {idle ? 'None' : (deviceName ?? 'Unknown device')}
        </Text>
        {statusText ? (
          <Text style={[type.label, connected ? styles.connected : styles.pending]}>{statusText}</Text>
        ) : null}
        {idle && error ? <Text style={[type.label, styles.error]}>{error}</Text> : null}
      </View>
      {!idle && status !== 'disconnecting' ? (
        <Button
          label={connected ? 'Disconnect' : 'Cancel'}
          variant="secondary"
          size="sm"
          onPress={onDisconnect}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  badge: {
    width: layout.minTouch,
    height: layout.minTouch,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: { backgroundColor: colors.accentSurface },
  text: { flex: 1 },
  label: { color: colors.textMuted },
  name: { color: colors.text, marginTop: 2 },
  connected: { color: colors.good, marginTop: 2 },
  pending: { color: colors.accentText, marginTop: 2 },
  error: { color: colors.danger, marginTop: 2 },
});
