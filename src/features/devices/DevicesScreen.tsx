import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Screen } from '@/components/ui/Screen';
import { SignalBars } from '@/components/ui/SignalBars';
import { Toggle } from '@/components/ui/Toggle';
import type { BluetoothState, ConnectionState, PairedDevice, ScannedDevice } from '@/data/types';
import { colors, layout, spacing, type } from '@/theme';
import { bluetoothProblem, isBusy, signalFor } from './bluetoothText';
import { ConnectionCard } from './ConnectionCard';
import { PairedDeviceList } from './PairedDeviceList';

export type DevicesScreenProps = {
  now: number;
  bluetoothState: BluetoothState;
  isScanning: boolean;
  devices: ScannedDevice[];
  scanError: string | null;
  connection: ConnectionState;
  pairedDevices: PairedDevice[];
  autoConnect: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  onConnect: (device: { id: string; name: string | null }) => void;
  onDisconnect: () => void;
  onForgetDevice: (device: PairedDevice) => void;
  onSetAutoConnect: (enabled: boolean) => void;
  onBack: () => void;
};

export function DevicesScreen({
  now,
  bluetoothState,
  isScanning,
  devices,
  scanError,
  connection,
  pairedDevices,
  autoConnect,
  onStartScan,
  onStopScan,
  onConnect,
  onDisconnect,
  onForgetDevice,
  onSetAutoConnect,
  onBack,
}: DevicesScreenProps) {
  const busy = isBusy(connection);
  const problem = bluetoothProblem(bluetoothState);

  return (
    <Screen
      scroll
      hero={<HeroHeader title="Devices" subtitle="Find, connect and manage your watch." onBack={onBack} />}
    >
      <ConnectionCard connection={connection} onDisconnect={onDisconnect} />

      {problem ? <ErrorBanner message={problem} tone="warning" style={styles.banner} /> : null}
      {scanError && !problem ? <ErrorBanner message={scanError} style={styles.banner} /> : null}

      <View style={styles.sectionRow}>
        <Text style={[type.label, styles.section]} accessibilityRole="header">
          NEARBY DEVICES
        </Text>
        {isScanning ? <ActivityIndicator size="small" color={colors.accent} /> : null}
      </View>

      <Button
        label={isScanning ? 'Stop Scanning' : 'Scan for Devices'}
        icon={isScanning ? 'square' : 'search'}
        variant={isScanning ? 'secondary' : 'primary'}
        onPress={isScanning ? onStopScan : onStartScan}
        disabled={busy || Boolean(problem)}
        fullWidth
      />

      <Card padding={0} style={styles.card}>
        {devices.length === 0 ? (
          <Text style={[type.body, styles.empty]}>
            {isScanning
              ? 'Looking for devices…'
              : 'Make sure your watch has Bluetooth on and is nearby, then tap Scan.'}
          </Text>
        ) : (
          devices.map((device, index) => (
            <DeviceRow
              key={device.id}
              device={device}
              current={device.id === connection.deviceId}
              disabled={busy}
              divider={index > 0}
              onPress={() => onConnect({ id: device.id, name: device.name })}
            />
          ))
        )}
      </Card>

      <Text style={[type.label, styles.section, styles.sectionGap]} accessibilityRole="header">
        PAIRED DEVICES
      </Text>
      <Card padding={0}>
        <Toggle
          label="Auto-connect"
          hint="Reconnect to your last device when the app opens"
          value={autoConnect}
          onValueChange={onSetAutoConnect}
        />
        <View style={styles.pairedDivider} />
        <View style={styles.pairedList}>
          <PairedDeviceList
            pairedDevices={pairedDevices}
            connection={connection}
            now={now}
            onConnect={onConnect}
            onForgetDevice={onForgetDevice}
          />
        </View>
      </Card>
    </Screen>
  );
}

function DeviceRow({
  device,
  current,
  disabled,
  divider,
  onPress,
}: {
  device: ScannedDevice;
  current: boolean;
  disabled: boolean;
  divider: boolean;
  onPress: () => void;
}) {
  const signal = signalFor(device.rssi);
  const inactive = disabled || current;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={`${device.name}${device.isHeartRateDevice ? ', heart rate device' : ''}, ${signal.label}`}
      accessibilityHint={current ? undefined : 'Connects to this device'}
      accessibilityState={{ disabled: inactive }}
      style={({ pressed }) => [
        styles.row,
        divider && styles.rowDivider,
        disabled && !current && styles.rowDisabled,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.rowText}>
        <View style={styles.nameRow}>
          {device.isHeartRateDevice ? (
            <Feather name="heart" size={14} color={colors.vital.pulse} style={styles.heart} />
          ) : null}
          <Text style={[type.bodyStrong, styles.name]} numberOfLines={1}>
            {device.name}
          </Text>
        </View>
        <View style={styles.signalRow}>
          <SignalBars bars={signal.bars} />
          <Text style={[type.caption, styles.muted]}>
            {signal.label} · {device.rssi} dBm
          </Text>
        </View>
      </View>
      <Text style={[type.label, current ? styles.current : styles.action]}>{current ? 'Current' : 'Connect'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { marginTop: spacing.lg },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    minHeight: layout.minTouch / 2,
  },
  section: { color: colors.textMuted, letterSpacing: 0.6, marginLeft: spacing.xs },
  sectionGap: { marginTop: spacing.xxl, marginBottom: spacing.sm },
  card: { marginTop: spacing.md },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.rowHeight + spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowDisabled: { opacity: 0.5 },
  rowPressed: { backgroundColor: colors.surfaceSunken },
  rowText: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  heart: { marginRight: spacing.xs + 2 },
  name: { color: colors.text, flexShrink: 1 },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  muted: { color: colors.textMuted },
  action: { color: colors.accentText },
  current: { color: colors.good },
  pairedDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  pairedList: { paddingTop: spacing.xs },
});
