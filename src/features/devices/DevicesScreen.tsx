import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { BluetoothState } from '@/data/types';
import { colors, spacing, type } from '@/theme';
import { bluetoothProblem } from './bluetoothText';
import { DeviceCard } from './DeviceCard';
import { formatCount, formatRate } from './deviceFormat';
import type { DevicesSummary, TestedDevice } from './deviceModel';
import { StatGrid } from './StatGrid';

export type DevicesScreenProps = {
  now: number;
  bluetoothState: BluetoothState;
  loading: boolean;
  error: string | null;
  connected: TestedDevice[];
  previous: TestedDevice[];
  summary: DevicesSummary;
  bottomInset: number;
  onAddDevice: () => void;
  onOpenDevice: (deviceId: string) => void;
  onConnect: (device: TestedDevice) => void;
  onDisconnect: (device: TestedDevice) => void;
  onForget: (device: TestedDevice) => void;
};

export function DevicesScreen(props: DevicesScreenProps) {
  const { bluetoothState, loading, error, connected, previous, summary, bottomInset, onAddDevice } = props;
  const problem = bluetoothProblem(bluetoothState);
  const none = connected.length === 0 && previous.length === 0;

  return (
    <Screen
      scroll
      bottomInset={bottomInset}
      hero={<HeroHeader title="Devices" subtitle="Every device you've tested, live and past." />}
    >
      <Card style={styles.first}>
        <StatGrid
          columns={2}
          items={[
            { label: 'Connected now', value: formatCount(summary.connectedNow) },
            { label: 'Devices tested', value: formatCount(summary.devicesTested) },
            { label: 'Readings today', value: formatCount(summary.readingsToday) },
            { label: 'Success rate', value: formatRate(summary.successRate) },
          ]}
        />
      </Card>

      {problem ? <ErrorBanner message={problem} tone="warning" style={styles.banner} /> : null}
      {error ? <ErrorBanner message={error} style={styles.banner} /> : null}

      {loading ? (
        <View style={styles.loading} accessibilityLabel="Loading device history">
          <ActivityIndicator color={colors.accent} />
          <Text style={[type.body, styles.muted]}>Loading device history…</Text>
        </View>
      ) : none ? (
        <Card style={styles.emptyCard}>
          <EmptyState
            icon="watch"
            title="No devices tested yet"
            message="Add a device to start recording. Its connection and data stats will show here."
            actionLabel="Add device"
            onAction={onAddDevice}
          />
        </Card>
      ) : (
        <>
          <Button label="Add device" icon="plus" onPress={onAddDevice} fullWidth style={styles.add} />

          <SectionLabel title={`Connected now (${connected.length})`} />
          {connected.length === 0 ? (
            <Card>
              <Text style={[type.body, styles.muted]}>
                No device connected right now. Connect one below, or add a new one.
              </Text>
            </Card>
          ) : (
            <View style={styles.list}>
              {connected.map((device) => (
                <Item key={device.deviceId} device={device} blocked={Boolean(problem)} {...props} />
              ))}
            </View>
          )}

          {previous.length > 0 ? (
            <>
              <SectionLabel title={`Previously connected (${previous.length})`} />
              <View style={styles.list}>
                {previous.map((device) => (
                  <Item key={device.deviceId} device={device} blocked={Boolean(problem)} {...props} />
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function Item({
  device,
  blocked,
  now,
  onOpenDevice,
  onConnect,
  onDisconnect,
  onForget,
}: DevicesScreenProps & { device: TestedDevice; blocked: boolean }) {
  return (
    <DeviceCard
      device={device}
      now={now}
      bluetoothBlocked={blocked}
      onOpen={() => onOpenDevice(device.deviceId)}
      onConnect={() => onConnect(device)}
      onDisconnect={() => onDisconnect(device)}
      onForget={() => onForget(device)}
    />
  );
}


const styles = StyleSheet.create({
  first: { marginTop: spacing.xl },
  banner: { marginTop: spacing.lg },
  add: { marginTop: spacing.lg },
  // One gap between cards.
  list: { gap: spacing.lg },
  muted: { color: colors.textMuted },
  loading: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.huge },
  emptyCard: { marginTop: spacing.lg },
});
