import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SignalBars } from '@/components/ui/SignalBars';
import { Toggle } from '@/components/ui/Toggle';
import type { BluetoothState, ConnectionState, PairedDevice, ScannedDevice } from '@/data/types';
import { colors, layout, spacing, type } from '@/theme';
import { bluetoothProblem, isBusy, signalFor } from './bluetoothText';
import { ConnectionCard } from './ConnectionCard';
import { NfcPairingCard, type NfcPairingCardProps } from './NfcPairingCard';
import { PairedDeviceList } from './PairedDeviceList';

export type AddDeviceScreenProps = {
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
  onOpenSettings?: () => void;
  // Every connected or connecting device, so each shows as Current (several devices at once)
  activeDeviceIds?: string[];
  // Real devices only; Previews leave it out
  nfc?: NfcPairingCardProps;
};

export function AddDeviceScreen({
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
  onOpenSettings,
  activeDeviceIds = [],
  nfc,
}: AddDeviceScreenProps) {
  const busy = isBusy(connection);
  const problem = bluetoothProblem(bluetoothState);

  return (
    <Screen
      scroll
      hero={<HeroHeader title="Add device" subtitle="Scan for a nearby device and connect." onBack={onBack} />}
    >
      <ConnectionCard connection={connection} onDisconnect={onDisconnect} />

      {problem ? (
        <ErrorBanner
          message={problem}
          tone="warning"
          actionLabel={bluetoothState === 'Unauthorized' ? 'Settings' : undefined}
          onAction={onOpenSettings}
          style={styles.banner}
        />
      ) : null}
      {scanError && !problem ? <ErrorBanner message={scanError} style={styles.banner} /> : null}

      <SectionLabel
        title="Nearby devices"
        right={isScanning ? <ActivityIndicator size="small" color={colors.accent} /> : null}
      />

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
              current={device.id === connection.deviceId || activeDeviceIds.includes(device.id)}
              disabled={busy}
              divider={index > 0}
              onPress={() => onConnect({ id: device.id, name: device.name })}
            />
          ))
        )}
      </Card>

      {nfc ? <NfcPairingCard {...nfc} /> : null}

      <SectionLabel title="Paired devices" />
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
            <Feather name="heart" size={layout.icon.inline} color={colors.vital.pulse} style={styles.heart} />
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
      <Text style={[type.bodyStrong, current ? styles.current : styles.action]}>{current ? 'Current' : 'Connect'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { marginTop: spacing.lg },
  card: { marginTop: spacing.lg },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.rowHeightTall,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowDisabled: { opacity: 0.5 },
  rowPressed: { backgroundColor: colors.surfaceSunken },
  rowText: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  heart: { marginRight: spacing.sm },
  name: { color: colors.text, flexShrink: 1 },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  muted: { color: colors.textMuted },
  action: { color: colors.accentText },
  current: { color: colors.good },
  pairedDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  pairedList: { paddingTop: spacing.xs },
});
