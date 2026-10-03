import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BarChart } from '@/components/ui/BarChart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { ListRow } from '@/components/ui/ListRow';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatReadout } from '@/components/ui/StatReadout';
import { TimeLineChart } from '@/components/ui/TimeLineChart';
import { Waveform } from '@/components/ui/Waveform';
import type { HistoryState, LatestReadingState, RestingHrTrends } from '@/data/types';
import { sourceLabel } from '@/lib/sensors/sourceLabel';
import { formatAge, LIVE_WITHIN_MS, STALE_AFTER_MS } from '@/lib/time';
import { averageByBucket, HOUR_MS } from '@/lib/trends';
import { colors, spacing, type } from '@/theme';

export type HeartRateScreenProps = {
  now: number;
  heartRate: LatestReadingState;
  history: HistoryState;
  restingTrends: RestingHrTrends | null;
  bottomInset: number;
  onOpenAlertThresholds: () => void;
  onAddTestReading?: () => void;
  onAddSampleData?: () => void;
};

export function HeartRateScreen({
  now,
  heartRate,
  history,
  restingTrends,
  bottomInset,
  onOpenAlertThresholds,
  onAddTestReading,
  onAddSampleData,
}: HeartRateScreenProps) {
  return (
    <Screen
      scroll
      bottomInset={bottomInset}
      hero={<HeroHeader title="Heart Rate" subtitle="Live BPM from your watch and your last 24 hours." />}
    >
      <LiveCard now={now} heartRate={heartRate} />
      <TrendCard history={history} />
      {restingTrends ? <RestingCard trends={restingTrends} /> : null}

      <Card padding={0} style={styles.card}>
        <ListRow
          icon="bell"
          label="Alert Thresholds"
          hint="Get notified when your heart rate is too high or too low"
          onPress={onOpenAlertThresholds}
        />
      </Card>

      {onAddTestReading || onAddSampleData ? (
        <Card style={styles.card}>
          <CardTitle icon="tool" title="Development" />
          <View style={styles.devButtons}>
            {onAddTestReading ? (
              <Button label="Add Test Reading" variant="secondary" size="md" onPress={onAddTestReading} fullWidth />
            ) : null}
            {onAddSampleData ? (
              <Button label="Add 24h of Sample Data" variant="secondary" size="md" onPress={onAddSampleData} fullWidth />
            ) : null}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

// Android: components/HeartRateDisplay.tsx (variant "large")
function LiveCard({ now, heartRate }: { now: number; heartRate: LatestReadingState }) {
  const { reading, loading, error } = heartRate;
  const age = reading ? now - reading.timestamp.getTime() : 0;
  const live = Boolean(reading) && age <= LIVE_WITHIN_MS;
  const stale = Boolean(reading) && age > STALE_AFTER_MS;
  const bpm = reading ? String(Math.round(reading.value)) : '--';

  return (
    <Card style={styles.first}>
      <CardTitle
        icon="heart"
        title="Heart Rate"
        right={reading ? (live ? <Pill label="Live" tier="live" dot /> : <Pill label={`Last seen ${formatAge(age)}`} tier="neutral" />) : null}
      />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      ) : error ? (
        <ErrorBanner message={error} style={styles.body} />
      ) : (
        <View
          style={styles.center}
          accessible
          accessibilityLabel={reading ? `Heart rate ${bpm} beats per minute, ${stale ? 'last reading' : 'updated'} ${formatAge(age)}` : 'Heart rate, no reading'}
        >
          <View style={styles.valueRow}>
            <Text style={[type.hero, styles.value, (!reading || stale) && styles.muted]} maxFontSizeMultiplier={1.3}>
              {bpm}
            </Text>
            <Text style={[type.subheading, styles.unit]}>BPM</Text>
          </View>

          {!reading ? (
            <Text style={[type.body, styles.message]}>No readings yet. Connect your wearable to start tracking.</Text>
          ) : (
            <>
              <Text style={[type.label, styles.message]}>
                {stale ? 'Last reading' : 'Updated'} {formatAge(age)}
              </Text>
              {sourceLabel(reading) ? (
                <Text style={[type.caption, styles.mutedText]}>from {sourceLabel(reading)}</Text>
              ) : null}
              <Waveform active={live} style={styles.wave} />
            </>
          )}
        </View>
      )}
    </Card>
  );
}

// Android: components/SensorTrendChart.tsx (type "heart_rate"): 30-min averages, Min / Avg / Max.
function TrendCard({ history }: { history: HistoryState }) {
  const { readings, start, end, loading, error } = history;
  const buckets = averageByBucket(readings, start, end, HOUR_MS / 2);
  const values = buckets.map((b) => b.value).filter((v): v is number => v !== null);
  const min = values.length ? Math.round(Math.min(...values)) : 0;
  const max = values.length ? Math.round(Math.max(...values)) : 0;
  const avg = values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;

  return (
    <Card style={styles.card}>
      <CardTitle icon="trending-up" title="Last 24 hours" right={<Pill label="30-min average" tier="neutral" />} />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      ) : error ? (
        <ErrorBanner message={error} style={styles.body} />
      ) : values.length === 0 ? (
        <Text style={[type.body, styles.empty]}>No heart rate readings in the last 24 hours.</Text>
      ) : (
        <>
          <View style={styles.stats}>
            <StatReadout value={min} unit="bpm" label="Min" size="medium" style={styles.stat} />
            <StatReadout value={avg} unit="bpm" label="Avg" size="medium" style={styles.stat} />
            <StatReadout value={max} unit="bpm" label="Max" size="medium" style={styles.stat} />
          </View>
          <TimeLineChart
            buckets={buckets}
            start={start}
            end={end}
            accessibilityLabel={`Heart rate over the last 24 hours: minimum ${min}, average ${avg}, maximum ${max} beats per minute`}
            style={styles.chart}
          />
        </>
      )}
    </Card>
  );
}

// iOS extra, moved here from the old Analytics/Sleep screen. No data source yet.
function RestingCard({ trends }: { trends: RestingHrTrends }) {
  const [range, setRange] = useState<'week' | 'month'>('week');
  return (
    <Card style={styles.card}>
      <CardTitle icon="heart" title="Resting heart rate" right={<Pill label="Lower is better" tier="neutral" />} />
      <SegmentedControl
        value={range}
        onChange={setRange}
        options={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
        style={styles.body}
      />
      <BarChart data={trends[range]} max={80} colorFor={() => colors.accent} style={styles.chart} />
    </Card>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: spacing.xl },
  card: { marginTop: spacing.lg },
  spinner: { marginVertical: spacing.huge },
  body: { marginTop: spacing.lg },
  center: { alignItems: 'center', marginTop: spacing.lg },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  value: { color: colors.text },
  muted: { color: colors.textMuted },
  mutedText: { color: colors.textMuted, marginTop: spacing.xs },
  unit: { color: colors.accent, marginLeft: spacing.sm },
  message: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  wave: { marginTop: spacing.lg, alignSelf: 'stretch' },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xxl },
  stats: { flexDirection: 'row', marginTop: spacing.lg },
  stat: { flex: 1 },
  chart: { marginTop: spacing.lg },
  devButtons: { gap: spacing.md, marginTop: spacing.lg },
});
