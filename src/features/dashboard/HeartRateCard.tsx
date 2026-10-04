import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { Pill } from '@/components/ui/Pill';
import { StatReadout } from '@/components/ui/StatReadout';
import { TimeLineChart } from '@/components/ui/TimeLineChart';
import { Waveform } from '@/components/ui/Waveform';
import type { HistoryState, LatestReadingState } from '@/data/types';
import { sourceLabel } from '@/lib/sensors/sourceLabel';
import { averageByBucket, HOUR_MS } from '@/lib/trends';
import { formatAge, LIVE_WITHIN_MS, STALE_AFTER_MS } from '@/lib/time';
import { colors, spacing, type } from '@/theme';
import type { RestingRange } from './dashboardModel';

type Props = {
  heartRate: LatestReadingState;
  history: HistoryState;
  restingRange: RestingRange | null;
  now: number;
  onPress: () => void;
};

export function HeartRateCard({ heartRate, history, restingRange, now, onPress }: Props) {
  const { reading, loading, error } = heartRate;
  const age = reading ? now - reading.timestamp.getTime() : 0;
  const live = Boolean(reading) && age <= LIVE_WITHIN_MS;
  const stale = Boolean(reading) && age > STALE_AFTER_MS;

  const badge = reading ? (
    live ? (
      <Pill label="Live" tier="live" dot shape="square" />
    ) : (
      <Pill label={`Last seen ${formatAge(age)}`} tier="neutral" shape="square" />
    )
  ) : null;

  const bpm = reading ? String(Math.round(reading.value)) : '--';

  return (
    <Card onPress={onPress} style={styles.card}>
      <CardTitle icon="heart" title="Heart Rate" right={badge} />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      ) : (
        <View
          style={styles.center}
          accessible
          accessibilityLabel={reading ? `Heart rate ${bpm} beats per minute` : 'Heart rate, no reading'}
        >
          <View style={styles.valueRow}>
            <Text style={[type.hero, styles.value, (!reading || stale) && styles.muted]} maxFontSizeMultiplier={1.3}>
              {bpm}
            </Text>
            <Text style={[type.subheading, styles.unit]}>BPM</Text>
          </View>

          {error ? (
            <Text style={[type.body, styles.message, styles.error]}>{error}</Text>
          ) : !reading ? (
            <Text style={[type.body, styles.message]}>
              No readings yet. Connect your wearable to start tracking.
            </Text>
          ) : restingRange ? (
            <Text style={[type.label, styles.message]}>
              Resting: {restingRange.low}–{restingRange.high} bpm ·{' '}
              <Text style={restingRange.status === 'Normal' ? styles.normal : styles.warning}>
                {restingRange.status}
              </Text>
            </Text>
          ) : null}

          {reading && sourceLabel(reading) ? (
            <Text style={[type.caption, styles.source]}>from {sourceLabel(reading)}</Text>
          ) : null}
          {reading ? <Waveform active={live} style={styles.wave} /> : null}
        </View>
      )}

      {!loading && reading ? <Trend history={history} /> : null}
    </Card>
  );
}

// Same chart as the Heart Rate detail page: 30-min averages, Min / Avg / Max (Android SensorTrendChart).
function Trend({ history }: { history: HistoryState }) {
  const buckets = averageByBucket(history.readings, history.start, history.end, HOUR_MS / 2);
  const values = buckets.map((b) => b.value).filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  const min = Math.round(Math.min(...values));
  const max = Math.round(Math.max(...values));
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);

  return (
    <View style={styles.trend}>
      <View style={styles.stats}>
        <StatReadout value={min} unit="bpm" label="Min" size="medium" style={styles.stat} />
        <StatReadout value={avg} unit="bpm" label="Avg" size="medium" style={styles.stat} />
        <StatReadout value={max} unit="bpm" label="Max" size="medium" style={styles.stat} />
      </View>
      <TimeLineChart
        buckets={buckets}
        start={history.start}
        end={history.end}
        accessibilityLabel={`Heart rate over the last 24 hours: minimum ${min}, average ${avg}, maximum ${max} beats per minute`}
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.xl },
  spinner: { marginVertical: spacing.huge },
  center: { alignItems: 'center', marginTop: spacing.lg },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  value: { color: colors.text },
  muted: { color: colors.textMuted },
  unit: { color: colors.accent, marginLeft: spacing.sm },
  message: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  error: { color: colors.danger },
  normal: { color: colors.vital.calm },
  warning: { color: colors.vital.peak },
  wave: { marginTop: spacing.lg, alignSelf: 'stretch' },
  source: { color: colors.textMuted, marginTop: spacing.xs },
  trend: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  stats: { flexDirection: 'row' },
  stat: { flex: 1 },
  chart: { marginTop: spacing.md },
});
