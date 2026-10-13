import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ConnectionState } from '@/data/types';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  connection: ConnectionState;
  onDisconnect: () => void;
};

// Android: ConnectionCard in app/(auth)/devices.tsx (same wording).
function statusText(c: ConnectionState): string {
  switch (c.status) {
    case 'connecting':
      return `Connecting (attempt ${c.attempt})…`;
    case 'reconnecting':
      return `Connection lost, reconnecting (attempt ${c.attempt})…`;
    case 'discovering':
      return 'Setting up device…';
    case 'connected':
      return '● Connected';
    case 'disconnecting':
      return 'Disconnecting…';
    case 'disconnected':
      return '';
  }
}

export function ConnectionCard({ connection, onDisconnect }: Props) {
  const { status, deviceName, batteryLevel, error } = connection;
  const idle = status === 'disconnected';
  const connected = status === 'connected';
  const failed = idle && Boolean(error);

  const tone = connected ? styles.ringOn : failed ? styles.ringFailed : idle ? styles.ringIdle : styles.ringPending;
  const iconColor = connected ? colors.accent : failed ? colors.danger : idle ? colors.textMuted : colors.accentText;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.ring, tone]}>
          {!idle && !connected ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Feather name="watch" size={26} color={iconColor} />
          )}
        </View>
        <View style={styles.text} accessible accessibilityLiveRegion="polite">
          <Text style={[type.subheading, styles.name]} numberOfLines={2}>
            {idle ? 'No device connected' : (deviceName ?? 'Unknown device')}
          </Text>
          {!idle ? (
            <Text style={[type.label, connected ? styles.connected : styles.pending]}>{statusText(connection)}</Text>
          ) : null}
          {connected && batteryLevel !== null ? (
            <Text style={[type.caption, styles.muted]}>Battery {batteryLevel}%</Text>
          ) : null}
          {failed ? <Text style={[type.label, styles.error]}>{error}</Text> : null}
          {idle && !failed ? (
            <Text style={[type.caption, styles.muted]}>Scan below to find your watch.</Text>
          ) : null}
        </View>
      </View>

      {!idle && status !== 'disconnecting' ? (
        <Button
          label={connected ? 'Disconnect' : 'Cancel'}
          variant="secondary"
          size="md"
          onPress={onDisconnect}
          fullWidth
          style={styles.action}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ring: {
    width: layout.avatarLarge - spacing.xl,
    height: layout.avatarLarge - spacing.xl,
    borderRadius: radius.pill,
    borderWidth: layout.deviceRingBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringIdle: { borderColor: colors.border, backgroundColor: colors.surfaceSunken },
  ringOn: { borderColor: colors.accent, backgroundColor: colors.accentSurface },
  ringPending: { borderColor: colors.accentBorder, backgroundColor: colors.accentSurface },
  ringFailed: { borderColor: colors.danger, backgroundColor: colors.dangerSurface },
  text: { flex: 1, gap: 2 },
  name: { color: colors.text },
  connected: { color: colors.good },
  pending: { color: colors.accentText },
  error: { color: colors.danger },
  muted: { color: colors.textMuted },
  action: { marginTop: spacing.lg },
});
