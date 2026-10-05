import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { Pill } from '@/components/ui/Pill';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StageTrack } from '@/components/ui/StageTrack';
import { StatReadout } from '@/components/ui/StatReadout';
import type { SleepSummary, SleepTrends } from '@/data/types';
import { formatDuration } from '@/lib/time';
import { colors, layout, radius, spacing, type } from '@/theme';
import type { SleepView } from './activityModel';
import { NotReported } from './NotReported';
import { stageMeta, stageOrder } from './sleepStages';

type Range = 'week' | 'month';

type Props = {
  view: SleepView | null;
  notReported: string;
};

// Was the Sleep page: last night (duration, score, stages) and Week/Month trends, for one source.
export function SleepSection({ view, notReported }: Props) {
  if (!view) return <NotReported icon="moon" title="Sleep" message={notReported} first />;
  return (
    <>
      <LastNightCard sleep={view.sleep} />
      {view.trends ? <TrendsSection trends={view.trends} /> : null}
    </>
  );
}

function LastNightCard({ sleep }: { sleep: SleepSummary }) {
  const total = sleep.stages.reduce((sum, s) => sum + s.minutes, 0) || 1;
  const stages = stageOrder
    .map((key) => sleep.stages.find((s) => s.key === key))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <Card style={styles.first}>
      <CardTitle icon="moon" title="Last night" right={<Pill label={sleep.rating} tier="good" />} />

      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={[type.statLarge, styles.value]}>{formatDuration(sleep.totalMinutes)}</Text>
          <Text style={[type.caption, styles.muted]}>Sleep Duration</Text>
        </View>
        <View style={styles.column}>
          <Text style={[type.statLarge, styles.value]}>
            {sleep.score}
            <Text style={[type.unit, styles.muted]}> /100</Text>
          </Text>
          <Text style={[type.caption, styles.muted]}>Sleep Score</Text>
        </View>
      </View>

      <Text style={[type.caption, styles.window]}>
        {sleep.start} – {sleep.end}
      </Text>

      <View style={styles.composition} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {stages.map((s) => (
          <View key={s.key} style={{ flex: s.minutes / total, backgroundColor: stageMeta[s.key].color }} />
        ))}
      </View>

      <View style={styles.stages}>
        {stages.map((s) => (
          <StageTrack
            key={s.key}
            label={stageMeta[s.key].label}
            duration={formatDuration(s.minutes)}
            color={stageMeta[s.key].color}
            segments={s.segments}
          />
        ))}
      </View>
    </Card>
  );
}

function TrendsSection({ trends }: { trends: SleepTrends }) {
  const [range, setRange] = useState<Range>('week');
  const data = trends[range];

  const average = (points: { value: number }[]) =>
    points.length ? points.reduce((sum, p) => sum + p.value, 0) / points.length : 0;

  return (
    <>
      <SegmentedControl
        value={range}
        onChange={setRange}
        options={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
        style={styles.range}
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard} padding={spacing.lg}>
          <StatReadout value={Math.round(average(data.score))} label="Avg score" icon="moon" size="medium" />
        </Card>
        <Card style={styles.summaryCard} padding={spacing.lg}>
          <StatReadout value={average(data.hours).toFixed(1)} unit="h" label="Avg sleep" icon="clock" size="medium" />
        </Card>
      </View>

      <Card style={styles.card}>
        <CardTitle
          icon="bar-chart-2"
          title="Sleep score"
          right={<Pill label={range === 'week' ? 'Last 7 nights' : 'Last 4 weeks'} tier="neutral" />}
        />
        <BarChart data={data.score} highlightLast style={styles.chart} />
        <Text style={[type.caption, styles.caption]}>
          Green is 85 and above, amber 65 to 84, red below 65.
        </Text>
      </Card>

      <Card style={styles.card}>
        <CardTitle icon="clock" title="Hours asleep" right={<Pill label="Dark = 7.5 h or more" tier="neutral" />} />
        <BarChart
          data={data.hours}
          max={9}
          colorFor={(value) => (value >= 7.5 ? colors.sleep.deep : colors.sleep.light)}
          style={styles.chart}
        />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: spacing.sm },
  card: { marginTop: spacing.lg },
  columns: { flexDirection: 'row', marginTop: spacing.lg },
  column: { flex: 1 },
  value: { color: colors.text },
  muted: { color: colors.textMuted },
  window: { color: colors.textMuted, marginTop: spacing.md },
  composition: {
    flexDirection: 'row',
    height: layout.stageBarHeight,
    borderRadius: radius.pill,
    overflow: 'hidden',
    gap: spacing.xs / 2,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  stages: { gap: spacing.lg },
  range: { marginTop: spacing.xl },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  summaryCard: { flex: 1 },
  chart: { marginTop: spacing.lg },
  caption: { color: colors.textMuted, marginTop: spacing.lg },
});
