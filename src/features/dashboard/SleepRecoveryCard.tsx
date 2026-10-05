import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from '@/components/ui/BarChart';
import { CardLink } from '@/components/ui/CardLink';
import { CardTitle } from '@/components/ui/CardTitle';
import { ExpandableCard } from '@/components/ui/ExpandableCard';
import { ExpandChevron } from '@/components/ui/ExpandChevron';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import type { SleepStageKey, SleepSummary, SleepTrends } from '@/data/types';
import { formatDuration } from '@/lib/time';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  sleep: SleepSummary | null;
  trends: SleepTrends | null;
  initiallyExpanded?: boolean;
  onOpen: () => void;
};

const allStages: { key: SleepStageKey; label: string; color: string }[] = [
  { key: 'deep', label: 'Deep', color: colors.sleep.deep },
  { key: 'rem', label: 'REM', color: colors.sleep.rem },
  { key: 'light', label: 'Light', color: colors.sleep.light },
  { key: 'awake', label: 'Awake', color: colors.sleep.awake },
];

const shownStages: { key: SleepStageKey; label: string; color: string }[] = [
  { key: 'deep', label: 'Deep', color: colors.sleep.deep },
  { key: 'rem', label: 'REM', color: colors.sleep.rem },
  { key: 'light', label: 'Light', color: colors.sleep.light },
];

export function SleepRecoveryCard({ sleep, trends, initiallyExpanded, onOpen }: Props) {
  return (
    <ExpandableCard
      style={styles.card}
      initiallyExpanded={initiallyExpanded}
      accessibilityLabel={sleep ? `Sleep and recovery, ${formatDuration(sleep.totalMinutes)}, score ${sleep.score}` : 'Sleep and recovery, no data'}
      header={({ expanded }) => (
        <>
          <CardTitle
            icon="moon"
            title="Sleep & Recovery"
            right={
              <View style={styles.right}>
                {sleep ? <Pill label={sleep.rating} tier="good" /> : null}
                <ExpandChevron expanded={expanded} />
              </View>
            }
          />
          {!sleep ? (
            <EmptyState
              icon="moon"
              title="No sleep data yet"
              message="Wear your watch to bed to see your sleep and recovery."
            />
          ) : (
            <SleepBody sleep={sleep} />
          )}
        </>
      )}
    >
      {!sleep ? (
        <Text style={[type.body, styles.caption]}>No sleep data yet.</Text>
      ) : (
        <>
          <Text style={[type.bodyStrong, styles.value]}>
            Bedtime {sleep.start} → Wake {sleep.end}
          </Text>
          {allStages.map((s) => {
            const minutes = sleep.stages.find((st) => st.key === s.key)?.minutes ?? 0;
            return (
              <View key={s.key} style={styles.stageRow} accessible accessibilityLabel={`${s.label} ${formatDuration(minutes)}`}>
                <View style={[styles.swatch, { backgroundColor: s.color }]} />
                <Text style={[type.body, styles.stageLabel]}>{s.label}</Text>
                <Text style={[type.bodyStrong, styles.value]}>{formatDuration(minutes)}</Text>
              </View>
            );
          })}
          {trends ? (
            <>
              <Text style={[type.caption, styles.caption]}>Last 7 nights · hours asleep</Text>
              <BarChart
                data={trends.week.hours}
                max={9}
                height={layout.miniChartHeight}
                colorFor={(v) => (v >= 7.5 ? colors.sleep.deep : colors.sleep.light)}
              />
            </>
          ) : null}
        </>
      )}
      <CardLink label="Open in Activity ›" hint="Opens Sleep in the Activity tab" onPress={onOpen} />
    </ExpandableCard>
  );
}

function SleepBody({ sleep }: { sleep: SleepSummary }) {
  const stages = shownStages.map((s) => ({
    ...s,
    minutes: sleep.stages.find((stage) => stage.key === s.key)?.minutes ?? 0,
  }));
  const total = stages.reduce((sum, s) => sum + s.minutes, 0) || 1;

  return (
    <>
      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={[type.statLarge, styles.value]}>{formatDuration(sleep.totalMinutes)}</Text>
          <Text style={[type.caption, styles.caption]}>Sleep Duration</Text>
        </View>
        <View style={styles.column}>
          <Text style={[type.statLarge, styles.value]}>
            {sleep.score}
            <Text style={[type.unit, styles.caption]}> /100</Text>
          </Text>
          <Text style={[type.caption, styles.caption]}>Sleep Score</Text>
        </View>
      </View>

      <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {stages.map((s) => (
          <View key={s.key} style={{ flex: s.minutes / total, backgroundColor: s.color }} />
        ))}
      </View>

      <View style={styles.legend}>
        {stages.map((s) => (
          <View key={s.key} style={styles.legendItem} accessible accessibilityLabel={`${s.label} ${formatDuration(s.minutes)}`}>
            <View style={styles.legendHead}>
              <View style={[styles.swatch, { backgroundColor: s.color }]} />
              <Text style={[type.label, styles.caption]}>{s.label}</Text>
            </View>
            <Text style={[type.bodyStrong, styles.value]}>{formatDuration(s.minutes)}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stageLabel: { minWidth: spacing.huge + spacing.xl, color: colors.textSecondary },
  card: { marginTop: spacing.lg },
  columns: { flexDirection: 'row', marginTop: spacing.lg },
  column: { flex: 1 },
  value: { color: colors.text },
  caption: { color: colors.textMuted },
  bar: {
    flexDirection: 'row',
    height: layout.stageBarHeight,
    borderRadius: radius.pill,
    overflow: 'hidden',
    gap: spacing.xs / 2,
    marginTop: spacing.xl,
  },
  legend: { flexDirection: 'row', marginTop: spacing.md },
  legendItem: { flex: 1 },
  legendHead: { flexDirection: 'row', alignItems: 'center' },
  swatch: { width: spacing.sm, height: spacing.sm, borderRadius: radius.pill, marginRight: spacing.xs + 2 },
});
