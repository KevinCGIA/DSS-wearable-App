import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { TimeBarChart } from '@/components/ui/TimeBarChart';
import type { HistoryState, LatestReadingState } from '@/data/types';
import { formatAge, isSameDay } from '@/lib/time';
import { HOUR_MS, stepsByBucket } from '@/lib/trends';
import { colors, spacing, type } from '@/theme';

export const DAILY_STEP_GOAL = 10000;

export type FitnessScreenProps = {
  now: number;
  steps: LatestReadingState;
  history: HistoryState;
  bottomInset: number;
  onAddTestSteps?: () => void;
  onAddSampleData?: () => void;
};

export function FitnessScreen({ now, steps, history, bottomInset, onAddTestSteps, onAddSampleData }: FitnessScreenProps) {
  return (
    <Screen
      scroll
      bottomInset={bottomInset}
      hero={<HeroHeader title="Fitness" subtitle="Your steps today and over the last 24 hours." />}
    >
      <StepsTodayCard now={now} steps={steps} />
      <StepsChartCard history={history} />

      {onAddTestSteps || onAddSampleData ? (
        <Card style={styles.card}>
          <CardTitle icon="tool" title="Development" />
          <View style={styles.devButtons}>
            {onAddTestSteps ? (
              <Button label="Add Test Steps" variant="secondary" size="md" onPress={onAddTestSteps} fullWidth />
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

// Android: components/StepsDisplay.tsx (variant "large")
function StepsTodayCard({ now, steps }: { now: number; steps: LatestReadingState }) {
  const { reading, loading, error } = steps;
  const today = reading && isSameDay(reading.timestamp, new Date(now)) ? Math.round(reading.value) : 0;
  const progress = Math.min(today / DAILY_STEP_GOAL, 1);
  const reached = progress >= 1;

  return (
    <Card style={styles.first}>
      <CardTitle
        icon="activity"
        title="Steps Today"
        right={reading && !loading && !error ? <Pill label={`${Math.round(progress * 100)}%`} tier={reached ? 'good' : 'live'} /> : null}
      />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      ) : error ? (
        <ErrorBanner message={error} style={styles.body} />
      ) : (
        <>
          <View style={styles.valueRow} accessible accessibilityLabel={`${today} steps today, goal ${DAILY_STEP_GOAL}`}>
            <Text style={[type.hero, styles.value]} maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit>
              {today.toLocaleString()}
            </Text>
          </View>
          <Text style={[type.body, styles.muted]}>of {DAILY_STEP_GOAL.toLocaleString()} step goal</Text>
          <ProgressBar
            progress={progress}
            color={reached ? colors.vital.calm : colors.accent}
            accessibilityLabel={`Step goal ${Math.round(progress * 100)} percent`}
            style={styles.progress}
          />
          {!reading ? (
            <Text style={[type.body, styles.message]}>No step data yet. Connect your wearable to start tracking.</Text>
          ) : reached ? (
            <View style={styles.reachedRow}>
              <Feather name="check-circle" size={16} color={colors.good} />
              <Text style={[type.bodyStrong, styles.reached]}>Goal reached!</Text>
            </View>
          ) : (
            <Text style={[type.caption, styles.message]}>Updated {formatAge(now - reading.timestamp.getTime())}</Text>
          )}
        </>
      )}
    </Card>
  );
}

// Android: components/SensorTrendChart.tsx (type "steps")
function StepsChartCard({ history }: { history: HistoryState }) {
  const { readings, start, end, loading, error } = history;
  const buckets = stepsByBucket(readings, start, end, HOUR_MS);
  const total = Math.round(buckets.reduce((sum, b) => sum + (b.value ?? 0), 0));
  const empty = !loading && !error && total === 0;

  return (
    <Card style={styles.card}>
      <CardTitle icon="bar-chart-2" title="Steps per Hour" right={<Pill label="Last 24 hours" tier="neutral" />} />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      ) : error ? (
        <ErrorBanner message={error} style={styles.body} />
      ) : empty ? (
        <Text style={[type.body, styles.emptyChart]}>No step data in the last 24 hours.</Text>
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={[type.statMedium, styles.value]}>{total.toLocaleString()}</Text>
            <Text style={[type.caption, styles.muted]}>Total</Text>
          </View>
          <TimeBarChart
            buckets={buckets}
            start={start}
            end={end}
            accessibilityLabel={`Steps per hour over the last 24 hours, ${total} in total`}
            style={styles.chart}
          />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: spacing.xl },
  card: { marginTop: spacing.lg },
  spinner: { marginVertical: spacing.huge },
  body: { marginTop: spacing.lg },
  valueRow: { marginTop: spacing.lg },
  value: { color: colors.text },
  muted: { color: colors.textMuted },
  progress: { marginTop: spacing.lg },
  message: { color: colors.textSecondary, marginTop: spacing.md },
  reachedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  reached: { color: colors.good },
  emptyChart: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xxl },
  summary: { marginTop: spacing.lg },
  chart: { marginTop: spacing.lg },
  devButtons: { gap: spacing.md, marginTop: spacing.lg },
});
