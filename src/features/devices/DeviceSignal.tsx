import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SignalBars } from '@/components/ui/SignalBars';
import { colors, spacing, type } from '@/theme';
import { signalFor } from './bluetoothText';
import { batteryText } from './deviceFormat';

type Props = {
  rssi: number | null;
  battery: number | null;
  // "Last known" for devices that aren't connected.
  lastKnown?: boolean;
};

export function DeviceSignal({ rssi, battery, lastKnown = false }: Props) {
  const signal = rssi === null ? null : signalFor(rssi);
  const prefix = lastKnown ? 'Last known: ' : '';
  return (
    <View style={styles.row}>
      {signal ? <SignalBars bars={signal.bars} /> : null}
      <Text style={[type.caption, styles.text]}>
        {prefix}
        {rssi === null ? 'Signal unknown' : `${rssi} dBm`} · {batteryText(battery)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  text: { color: colors.textSecondary, flexShrink: 1 },
});
