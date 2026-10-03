import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import type { ConnectionState, PairedDevice } from '@/data/types';
import { formatAge } from '@/lib/time';
import { isBusy } from './bluetoothText';
import { colors, layout, spacing, type } from '@/theme';

type Props = {
  pairedDevices: PairedDevice[];
  connection: ConnectionState;
  now: number;
  onConnect: (device: { id: string; name: string | null }) => void;
  onForgetDevice: (device: PairedDevice) => void;
};

// Android: components/PairedDeviceList.tsx
export function PairedDeviceList({ pairedDevices, connection, now, onConnect, onForgetDevice }: Props) {
  const busy = isBusy(connection);

  if (pairedDevices.length === 0) {
    return (
      <Text style={[type.body, styles.empty]}>
        No paired devices yet. Devices you connect to will appear here.
      </Text>
    );
  }

  return (
    <View>
      {pairedDevices.map((device, index) => {
        const current = device.deviceId === connection.deviceId;
        const connected = current && connection.status === 'connected';
        const detail = connected
          ? '● Connected'
          : current && busy
            ? 'Connecting…'
            : device.lastConnectedAt
              ? `Last connected ${formatAge(now - device.lastConnectedAt.getTime())}`
              : 'Not connected';

        return (
          <View key={device.deviceId} style={[styles.row, index > 0 && styles.divider]}>
            <View style={styles.text}>
              <Text style={[type.bodyStrong, styles.name]} numberOfLines={1}>
                {device.name}
              </Text>
              <Text style={[type.caption, connected ? styles.connected : styles.detail]}>{detail}</Text>
            </View>
            {!current ? (
              <Button
                label="Connect"
                variant="ghost"
                size="sm"
                disabled={busy}
                onPress={() => onConnect({ id: device.deviceId, name: device.name })}
              />
            ) : null}
            <Button label="Forget" variant="destructive" size="sm" onPress={() => onForgetDevice(device)} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.rowHeight,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  text: { flex: 1, paddingVertical: spacing.sm },
  name: { color: colors.text },
  detail: { color: colors.textMuted, marginTop: 2 },
  connected: { color: colors.good, marginTop: 2 },
});
