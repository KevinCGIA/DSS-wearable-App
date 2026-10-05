import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CardLink } from '@/components/ui/CardLink';
import { CardTitle } from '@/components/ui/CardTitle';
import { ExpandableCard } from '@/components/ui/ExpandableCard';
import { ExpandChevron } from '@/components/ui/ExpandChevron';
import { Pill } from '@/components/ui/Pill';
import { StatReadout } from '@/components/ui/StatReadout';
import { TimeLineChart } from '@/components/ui/TimeLineChart';
import { Waveform } from '@/components/ui/Waveform';
import type { HistoryState, LatestReadingState } from '@/data/types';
import { sourceLabel } from '@/lib/sensors/sourceLabel';
import { formatAge, LIVE_WITHIN_MS, STALE_AFTER_MS } from '@/lib/time';
import { averageByBucket, HOUR_MS } from '@/lib/trends';
import { colors, spacing, type } from '@/theme';
import type { RestingRange } from './dashboardModel';

type Props = {
  heartRate: LatestReadingState;
  history: HistoryState;
  restingRange: RestingRange | null;
  now: number;
  initiallyExpanded?: boolean;
  onOpen: () => void;
};

const clock = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export function HeartRateCard({ heartRate, history, restingRange, now, initiallyExpanded, onOpen }: Props) {
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
    <ExpandableCard
      style={styles.card}
      initiallyExpanded={initiallyExpanded}
      accessibilityLabel={reading ? `Heart rate, ${bpm} beats per minute` : 'Heart rate, no reading'}
      header={({ expanded }) => (
        <>
          <CardTitle
            icon="heart"
            title="Heart Rate"
            right={
              <View style={styles.right}>
                {badge}
                <ExpandChevron expanded={expanded} />
              </View>
            }
          />

          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.spinner} />
          ) : (
            <View style={styles.center}>
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

              {reading ? <Waveform active={live} style={styles.wave} /> : null}
            </View>
          )}
        </>
      )}
    >
      <Trend history={history} />
      {reading ? (
        <Text style={[type.caption, styles.muted]}>
          Last reading {clock(reading.timestamp)} ({formatAge(age)})
          {sourceLabel(reading) ? ` · from ${sourceLabel(reading)}` : ''}
        </Text>
      ) : null}
      <CardLink label="Open in Activity ›" hint="Opens Heart Rate in the Activity tab" onPress={onOpen} />
    </ExpandableCard>
  );
}

// Same as Activity's Heart Rate section: 30-min averages, Min / Avg / Max (Android SensorTrendChart).
function Trend({ history }: { history: HistoryState }) {
  const buckets = averageByBucket(history.readings, history.start, history.end, HOUR_MS / 2);
  const values = buckets.map((b) => b.value).filter((v): v is number => v !== null);
  if (values.length === 0) {
    return <Text style={[type.body, styles.muted]}>No heart rate readings in the last 24 hours.</Text>;
  }
  const min = Math.round(Math.min(...values));
  const max = Math.round(Math.max(...values));
  const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);

  return (
    <View>
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
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  stats: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm },
  stat: { flexGrow: 1, flexBasis: '30%' },
  chart: { marginTop: spacing.md },
});
