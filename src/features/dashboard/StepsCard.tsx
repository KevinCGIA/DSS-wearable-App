import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { Pill } from '@/components/ui/Pill';
import { TimeBarChart } from '@/components/ui/TimeBarChart';
import type { HistoryState, LatestReadingState } from '@/data/types';
import { sourceLabel } from '@/lib/sensors/sourceLabel';
import { formatAge } from '@/lib/time';
import { HOUR_MS, stepsByBucketAcrossDevices } from '@/lib/trends';
import { colors, spacing, type } from '@/theme';
import { stepsTodayFrom } from './dashboardModel';

type Props = {
  steps: LatestReadingState;
  history: HistoryState;
  now: number;
  onPress: () => void;
};

// Android StepsDisplay + SensorTrendChart (steps), without the step goal.
export function StepsCard({ steps, history, now, onPress }: Props) {
  const { reading, loading, error } = steps;
  const today = stepsTodayFrom(reading, now);
  const buckets = stepsByBucketAcrossDevices(history.readings, history.start, history.end, HOUR_MS);
  const total = Math.round(buckets.reduce((sum, b) => sum + (b.value ?? 0), 0));

  return (
    <Card onPress={onPress} style={styles.card}>
      <CardTitle
        icon="trending-up"
        title="Steps"
        right={reading ? <Pill label={`Updated ${formatAge(now - reading.timestamp.getTime())}`} tier="neutral" /> : null}
      />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      ) : error ? (
        <Text style={[type.body, styles.message, styles.error]}>{error}</Text>
      ) : !reading ? (
        <Text style={[type.body, styles.message]}>No step data yet. Connect your wearable to start tracking.</Text>
      ) : (
        <>
          <View style={styles.valueRow} accessible accessibilityLabel={`${today} steps today`}>
            <Text style={[type.statLarge, styles.value]}>{today.toLocaleString()}</Text>
            <Text style={[type.unit, styles.muted]}> steps today</Text>
          </View>
          {sourceLabel(reading) ? (
            <Text style={[type.caption, styles.muted]}>from {sourceLabel(reading)}</Text>
          ) : null}
          {total > 0 ? (
            <View style={styles.trend}>
              <Text style={[type.caption, styles.muted]}>
                Last 24 hours · {total.toLocaleString()} total
              </Text>
              <TimeBarChart
                buckets={buckets}
                start={history.start}
                end={history.end}
                accessibilityLabel={`Steps per hour over the last 24 hours, ${total} in total`}
                style={styles.chart}
              />
            </View>
          ) : null}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  spinner: { marginVertical: spacing.huge },
  message: { color: colors.textSecondary, marginTop: spacing.lg },
  error: { color: colors.danger },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.lg },
  value: { color: colors.text },
  muted: { color: colors.textMuted },
  trend: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  chart: { marginTop: spacing.md },
});
