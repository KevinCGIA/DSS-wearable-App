import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { Pill } from '@/components/ui/Pill';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatReadout } from '@/components/ui/StatReadout';
import { TimeLineChart } from '@/components/ui/TimeLineChart';
import type { HistoryState, RestingHrTrends } from '@/data/types';
import { formatAge, STALE_AFTER_MS } from '@/lib/time';
import { averageByBucket, HOUR_MS } from '@/lib/trends';
import { colors, spacing, type } from '@/theme';
import type { HeartRateView } from './activityModel';
import { NotReported } from './NotReported';

type Props = {
  now: number;
  view: HeartRateView | null;
  notReported: string;
};

// Was the Heart Rate page (Android: app/(auth)/heart-rate.tsx), for one source only.
export function HeartRateSection({ now, view, notReported }: Props) {
  if (!view) return <NotReported icon="heart" title="Heart Rate" message={notReported} first />;

  const { latest, restingRange } = view;
  const age = latest ? now - latest.timestamp.getTime() : 0;
  const stale = age > STALE_AFTER_MS;
  const bpm = latest ? String(Math.round(latest.value)) : '--';

  return (
    <>
      <Card>
        <CardTitle icon="heart" title="Heart Rate" />
        <View
          style={styles.center}
          accessible
          accessibilityLabel={`Heart rate ${bpm} beats per minute, updated ${formatAge(age)}${stale ? ', not recent' : ''}`}
        >
          <View style={styles.valueRow}>
            <Text style={[type.hero, styles.value, stale && styles.muted]} maxFontSizeMultiplier={1.3}>
              {bpm}
            </Text>
            <Text style={[type.unit, styles.unit, stale && styles.muted]}>BPM</Text>
          </View>
          <Text style={[type.label, stale ? styles.muted : styles.secondary]}>Updated {formatAge(age)}</Text>
          {restingRange ? (
            <Text style={[type.caption, styles.secondary, styles.resting]}>
              Resting range: {restingRange.low}–{restingRange.high} bpm ·{' '}
              <Text style={restingRange.status === 'Normal' ? styles.normal : styles.warning}>{restingRange.status}</Text>
            </Text>
          ) : null}
        </View>
      </Card>

      <TrendCard history={view.history} />
      {view.restingTrends ? (
        <RestingCard trends={view.restingTrends} />
      ) : (
        <NotReported icon="moon" title="Resting heart rate" message={notReported} />
      )}
    </>
  );
}

// Android: components/SensorTrendChart.tsx (type "heart_rate"): 30-min averages, Min / Avg / Max, gaps as breaks.
function TrendCard({ history }: { history: HistoryState }) {
  const { readings, start, end } = history;
  const buckets = averageByBucket(readings, start, end, HOUR_MS / 2);
  const values = buckets.map((b) => b.value).filter((v): v is number => v !== null);
  const min = values.length ? Math.round(Math.min(...values)) : 0;
  const max = values.length ? Math.round(Math.max(...values)) : 0;
  const avg = values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;

  return (
    <Card style={styles.card}>
      <CardTitle icon="trending-up" title="Last 24 hours" right={<Pill label="30-min average" tier="neutral" />} />
      {values.length === 0 ? (
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

function RestingCard({ trends }: { trends: RestingHrTrends }) {
  const [range, setRange] = useState<'week' | 'month'>('week');
  return (
    <Card style={styles.card}>
      <CardTitle icon="moon" title="Resting heart rate" right={<Pill label="Lower is better" tier="neutral" />} />
      <SegmentedControl
        value={range}
        onChange={setRange}
        options={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
        style={styles.chart}
      />
      <BarChart data={trends[range]} max={80} colorFor={() => colors.accent} style={styles.chart} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  center: { alignItems: 'center', marginTop: spacing.lg },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  value: { color: colors.text },
  unit: { color: colors.accent, marginLeft: spacing.xs },
  muted: { color: colors.textMuted },
  secondary: { color: colors.textSecondary, textAlign: 'center' },
  resting: { marginTop: spacing.md },
  normal: { color: colors.good },
  warning: { color: colors.warning },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xxl },
  stats: { flexDirection: 'row', marginTop: spacing.lg },
  stat: { flex: 1 },
  chart: { marginTop: spacing.lg },
});
