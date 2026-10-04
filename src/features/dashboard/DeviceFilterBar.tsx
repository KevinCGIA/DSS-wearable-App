import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors, spacing, type } from '@/theme';
import type { DashboardDevice } from './dashboardModel';

type Props = {
  devices: DashboardDevice[];
  deviceId: string | null;
  onChange: (deviceId: string | null) => void;
};

// Shown only when more than one device is connected.
export function DeviceFilterBar({ devices, deviceId, onChange }: Props) {
  if (devices.length < 2) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[type.label, styles.label]}>SHOWING</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Button
          label="All devices"
          size="sm"
          variant={deviceId === null ? 'primary' : 'secondary'}
          onPress={() => onChange(null)}
        />
        {devices.map((device) => (
          <Button
            key={device.deviceId}
            label={device.name}
            size="sm"
            variant={deviceId === device.deviceId ? 'primary' : 'secondary'}
            onPress={() => onChange(device.deviceId)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  label: { color: colors.textMuted, letterSpacing: 0.6, marginLeft: spacing.xs, marginBottom: spacing.sm },
  row: { gap: spacing.sm },
});
