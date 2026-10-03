import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StageTrack } from '@/components/ui/StageTrack';
import { StatReadout } from '@/components/ui/StatReadout';
import { colors, radius, spacing, type } from '@/theme';
import {
  lastNight,
  sleepStages,
  weeklyRestingHr,
  weeklySleepHours,
  weeklySleepScore,
} from '@/data/sleep';

type Range = 'week' | 'month';

const monthlySleepScore = [
  { label: 'W1', value: 82 },
  { label: 'W2', value: 74 },
  { label: 'W3', value: 88 },
  { label: 'W4', value: 79 },
];

const monthlySleepHours = [
  { label: 'W1', value: 7.4 },
  { label: 'W2', value: 6.8 },
  { label: 'W3', value: 7.9 },
  { label: 'W4', value: 7.2 },
];

const monthlyRestingHr = [
  { label: 'W1', value: 59 },
  { label: 'W2', value: 62 },
  { label: 'W3', value: 57 },
  { label: 'W4', value: 60 },
];

type Props = { bottomInset: number };

export function AnalyticsScreen({ bottomInset }: Props) {
  const [range, setRange] = useState<Range>('week');

  const data = useMemo(
    () =>
      range === 'week'
        ? { score: weeklySleepScore, hours: weeklySleepHours, hr: weeklyRestingHr }
        : { score: monthlySleepScore, hours: monthlySleepHours, hr: monthlyRestingHr },
    [range],
  );

  const avgScore = Math.round(
    data.score.reduce((sum, bar) => sum + bar.value, 0) / data.score.length,
  );
  const avgHours = data.hours.reduce((sum, bar) => sum + bar.value, 0) / data.hours.length;
  const avgHr = Math.round(data.hr.reduce((sum, bar) => sum + bar.value, 0) / data.hr.length);

  const totalStageMinutes = sleepStages.reduce((sum, stage) => sum + stage.minutes, 0);

  return (
    <Screen scroll bottomInset={bottomInset}>
      <Text style={[type.title, styles.title]}>Insights</Text>
      <Text style={[type.body, styles.blurb]}>
        Trends across your recorded sessions, drawn from the paired band.
      </Text>

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
          <StatReadout value={avgScore} label="Avg score" icon="moon" size="medium" />
        </Card>
        <Card style={styles.summaryCard} padding={spacing.lg}>
          <StatReadout value={avgHours.toFixed(1)} unit="h" label="Avg sleep" icon="clock" size="medium" />
        </Card>
        <Card style={styles.summaryCard} padding={spacing.lg}>
          <StatReadout value={avgHr} unit="bpm" label="Resting" icon="heart" size="medium" />
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[type.heading, styles.sectionTitle]}>Sleep score</Text>
        <Pill label={range === 'week' ? 'Last 7 nights' : 'Last 4 weeks'} tier="neutral" />
      </View>
      <Card style={styles.chartCard}>
        <BarChart data={data.score} highlightLast />
        <Text style={[type.caption, styles.caption]}>
          Green is 85 and above, amber 65 to 84, red below 65.
        </Text>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={[type.heading, styles.sectionTitle]}>Hours asleep</Text>
        <Pill label="Target 8h" tier="live" dot />
      </View>
      <Card style={styles.chartCard}>
        <BarChart
          data={data.hours}
          max={9}
          colorFor={(value) => (value >= 7.5 ? colors.sleep.deep : colors.sleep.light)}
        />
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={[type.heading, styles.sectionTitle]}>Resting heart rate</Text>
        <Pill label="Lower is better" tier="neutral" />
      </View>
      <Card style={styles.chartCard}>
        <BarChart data={data.hr} max={80} colorFor={() => colors.accent} />
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={[type.heading, styles.sectionTitle]}>Stage breakdown</Text>
        <Pill label={lastNight.totalLabel} tier="session" icon="moon" />
      </View>
      <Card style={styles.chartCard}>
        <View style={styles.composition}>
          {sleepStages.map((stage) => (
            <View
              key={stage.key}
              style={{
                flex: stage.minutes / totalStageMinutes,
                backgroundColor: stage.color,
              }}
            />
          ))}
        </View>
        <View style={styles.stages}>
          {sleepStages.map((stage) => (
            <StageTrack
              key={stage.key}
              label={stage.label}
              duration={stage.duration}
              color={stage.color}
              segments={stage.segments}
            />
          ))}
        </View>
        <Text style={[type.caption, styles.caption]}>
          Bands show when each stage occurred between {lastNight.start} and {lastNight.end}.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, marginTop: spacing.lg },
  blurb: { color: colors.textSecondary, marginTop: spacing.xs },
  range: { marginTop: spacing.xl },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  summaryCard: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxxl,
  },
  sectionTitle: { color: colors.text },
  chartCard: { marginTop: spacing.lg },
  caption: { color: colors.textMuted, marginTop: spacing.lg },
  composition: {
    flexDirection: 'row',
    height: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  stages: { gap: spacing.lg },
});
