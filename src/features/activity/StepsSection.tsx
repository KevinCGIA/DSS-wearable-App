import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { Pill } from '@/components/ui/Pill';
import { TimeBarChart } from '@/components/ui/TimeBarChart';
import { stepsTodayFrom } from '@/features/dashboard/dashboardModel';
import { formatAge } from '@/lib/time';
import { HOUR_MS, stepsByBucketAcrossDevices } from '@/lib/trends';
import { colors, spacing, type } from '@/theme';
import type { StepsView } from './activityModel';
import { NotReported } from './NotReported';

type Props = {
  now: number;
  view: StepsView | null;
  notReported: string;
};

// Was the Steps page (Android: app/(auth)/fitness.tsx) without any goal. Steps only; no distance,
// floors or calories (no source reports them, and they're never estimated).
export function StepsSection({ now, view, notReported }: Props) {
  if (!view) return <NotReported icon="trending-up" title="Steps" message={notReported} first />;

  const today = stepsTodayFrom(view.latest, now);
  const { readings, start, end } = view.history;
  const buckets = stepsByBucketAcrossDevices(readings, start, end, HOUR_MS);
  const total = Math.round(buckets.reduce((sum, b) => sum + (b.value ?? 0), 0));
  const withData = view.daily.filter((d) => d.value > 0);
  const average = withData.length ? Math.round(withData.reduce((s, d) => s + d.value, 0) / withData.length) : 0;

  return (
    <>
      <Card style={styles.first}>
        <CardTitle icon="trending-up" title="Steps today" />
        <Text
          style={[type.hero, styles.value]}
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          adjustsFontSizeToFit
          accessibilityLabel={`${today} steps today`}
        >
          {today.toLocaleString()}
        </Text>
        {view.latest ? (
          <Text style={[type.caption, styles.secondary]}>Updated {formatAge(now - view.latest.timestamp.getTime())}</Text>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <CardTitle icon="bar-chart-2" title="Steps per hour" />
        {total === 0 ? (
          <Text style={[type.body, styles.empty]}>No step data in the last 24 hours.</Text>
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

      <Card style={styles.card}>
        <CardTitle icon="calendar" title="Daily steps" right={<Pill label="Last 7 days" tier="neutral" />} />
        <View
          style={styles.summary}
          accessible
          accessibilityLabel={`Daily steps over the last 7 days: ${view.daily.map((d) => `${d.label} ${d.value}`).join(', ')}`}
        >
          <Text style={[type.statMedium, styles.value]}>{withData.length ? average.toLocaleString() : '--'}</Text>
          <Text style={[type.caption, styles.muted]}>Daily average · days with data</Text>
        </View>
        <BarChart
          data={view.daily}
          showValues={false}
          highlightLast
          colorFor={() => colors.accent}
          style={styles.chart}
        />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: spacing.sm },
  card: { marginTop: spacing.lg },
  value: { color: colors.text, marginTop: spacing.md },
  secondary: { color: colors.textSecondary, marginTop: spacing.sm },
  muted: { color: colors.textMuted },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xxl },
  summary: { marginTop: spacing.sm },
  chart: { marginTop: spacing.lg },
});
