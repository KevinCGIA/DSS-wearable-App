import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import type { SleepStageKey, SleepSummary } from '@/data/types';
import { formatDuration } from '@/lib/time';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  sleep: SleepSummary | null;
  onPress: () => void;
};

const shownStages: { key: SleepStageKey; label: string; color: string }[] = [
  { key: 'deep', label: 'Deep', color: colors.sleep.deep },
  { key: 'rem', label: 'REM', color: colors.sleep.rem },
  { key: 'light', label: 'Light', color: colors.sleep.light },
];

export function SleepRecoveryCard({ sleep, onPress }: Props) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <CardTitle
        icon="moon"
        title="Sleep & Recovery"
        right={sleep ? <Pill label={sleep.rating} tier="good" /> : null}
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
    </Card>
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
