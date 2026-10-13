import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pill } from '@/components/ui/Pill';
import { measureLabel, METRIC_BY_ID } from '@/lib/biometrics/metrics';
import type { DeviceMeasure } from '@/lib/biometrics/metrics';
import { spacing } from '@/theme';

type Props = { measures: DeviceMeasure[] };

// What the device measures, from the health services it provides. Nothing when unknown
// (e.g. paired before this was recorded, or on another phone).
export function DeviceMeasures({ measures }: Props) {
  if (!measures.length) return null;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Measures: ${measures.map(measureLabel).join(', ')}`}
    >
      {measures.map((m) => (
        <Pill
          key={m}
          label={measureLabel(m)}
          icon={m === 'activity_monitor' ? 'slash' : METRIC_BY_ID[m].icon}
          tier={m === 'activity_monitor' ? 'warning' : 'neutral'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
