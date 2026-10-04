import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import type { DailyActivityExtras } from '@/data/types';
import { distanceFor, unitLabels } from '@/lib/measures';
import type { Units } from '@/lib/measures';
import { colors, spacing, type } from '@/theme';

type Props = {
  activity: DailyActivityExtras;
  units: Units;
};

// No real source for these yet (Android has none), so the real flow always shows "--".
export function MetricsCard({ activity, units }: Props) {
  const distance = distanceFor(units, activity.distanceKm);
  const none = distance === null && activity.floors === null && activity.activeCalories === null;

  return (
    <Card style={styles.card}>
      <CardTitle icon="bar-chart-2" title="Distance · Floors · Calories" />
      <View style={styles.row}>
        <Metric
          label="Distance"
          value={distance !== null ? distance.toFixed(1) : '--'}
          unit={distance !== null ? unitLabels(units).distance : undefined}
        />
        <Metric label="Floors" value={activity.floors !== null ? String(activity.floors) : '--'} />
        <Metric
          label="Active calories"
          value={activity.activeCalories !== null ? activity.activeCalories.toLocaleString() : '--'}
          unit={activity.activeCalories !== null ? 'kcal' : undefined}
        />
      </View>
      {none ? <Text style={[type.caption, styles.hint]}>Not reported by connected devices yet.</Text> : null}
    </Card>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.metric} accessible accessibilityLabel={`${label}: ${value === '--' ? 'no data' : `${value} ${unit ?? ''}`}`}>
      <Text style={[type.caption, styles.muted]}>{label}</Text>
      <Text style={[type.statSmall, styles.value]} numberOfLines={1}>
        {value}
        {unit ? <Text style={[type.caption, styles.muted]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  row: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.md },
  metric: { flex: 1 },
  value: { color: colors.text, marginTop: spacing.xs },
  muted: { color: colors.textMuted },
  hint: { color: colors.textMuted, marginTop: spacing.md },
});
