import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Screen } from '@/components/ui/Screen';
import { TimeBarChart } from '@/components/ui/TimeBarChart';
import type { HistoryState, LatestReadingState } from '@/data/types';
import { sourceLabel } from '@/lib/sensors/sourceLabel';
import { formatAge, isSameDay } from '@/lib/time';
import { HOUR_MS, stepsByBucketAcrossDevices } from '@/lib/trends';
import { colors, spacing, type } from '@/theme';

export type StepsScreenProps = {
  now: number;
  steps: LatestReadingState;
  history: HistoryState;
  // "All devices" or the device picked in the Dashboard filter.
  showing: string;
  onBack: () => void;
  onAddTestSteps?: () => void;
  onAddSampleData?: () => void;
};

// Was Android's Fitness tab (app/(auth)/fitness.tsx). iOS: a pushed "Steps" detail page, no step goal.
export function StepsScreen({ now, steps, history, showing, onBack, onAddTestSteps, onAddSampleData }: StepsScreenProps) {
  return (
    <Screen
      scroll
      hero={<HeroHeader title="Steps" subtitle={`Today and the last 24 hours · ${showing}`} onBack={onBack} />}
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

// Android: components/StepsDisplay.tsx (variant "large"), without the 10,000 goal.
function StepsTodayCard({ now, steps }: { now: number; steps: LatestReadingState }) {
  const { reading, loading, error } = steps;
  const today = reading && isSameDay(reading.timestamp, new Date(now)) ? Math.round(reading.value) : 0;

  return (
    <Card style={styles.first}>
      <CardTitle icon="trending-up" title="Steps today" />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      ) : error ? (
        <ErrorBanner message={error} style={styles.body} />
      ) : (
        <>
          <View style={styles.valueRow} accessible accessibilityLabel={`${today} steps today`}>
            <Text style={[type.hero, styles.value]} maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit>
              {today.toLocaleString()}
            </Text>
          </View>
          {!reading ? (
            <Text style={[type.body, styles.message]}>No step data yet. Connect your wearable to start tracking.</Text>
          ) : (
            <Text style={[type.caption, styles.message]}>
              Updated {formatAge(now - reading.timestamp.getTime())}
              {sourceLabel(reading) ? ` · from ${sourceLabel(reading)}` : ''}
            </Text>
          )}
        </>
      )}
    </Card>
  );
}

// Android: components/SensorTrendChart.tsx (type "steps")
function StepsChartCard({ history }: { history: HistoryState }) {
  const { readings, start, end, loading, error } = history;
  const buckets = stepsByBucketAcrossDevices(readings, start, end, HOUR_MS);
  const total = Math.round(buckets.reduce((sum, b) => sum + (b.value ?? 0), 0));
  const empty = !loading && !error && total === 0;

  return (
    <Card style={styles.card}>
      <CardTitle icon="bar-chart-2" title="Steps per hour" />

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
            <Text style={[type.caption, styles.muted]}>Total · last 24 hours</Text>
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
  message: { color: colors.textSecondary, marginTop: spacing.md },
  emptyChart: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xxl },
  summary: { marginTop: spacing.lg },
  chart: { marginTop: spacing.lg },
  devButtons: { gap: spacing.md, marginTop: spacing.lg },
});
