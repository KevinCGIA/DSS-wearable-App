import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { DailyActivityExtras } from '@/data/types';
import { colors, spacing, type } from '@/theme';

type Props = {
  activity: DailyActivityExtras;
  onPress: () => void;
};

export function ActiveCaloriesCard({ activity, onPress }: Props) {
  const { activeCalories, calorieTarget } = activity;
  const progress = activeCalories !== null && calorieTarget > 0 ? activeCalories / calorieTarget : 0;
  const percent = Math.round(progress * 100);

  return (
    <Card onPress={onPress} style={styles.card}>
      <CardTitle
        ionicon="flame-outline"
        title="Active Calories"
        right={<Pill label={`Target: ${calorieTarget}`} tier="neutral" />}
      />

      <View style={styles.row}>
        <Text style={[type.statLarge, styles.value]}>
          {activeCalories !== null ? activeCalories.toLocaleString() : '--'}
          <Text style={[type.unit, styles.unit]}> kcal</Text>
        </Text>
        {activeCalories !== null ? (
          <Text style={[type.label, styles.percent]}>{percent}% achieved</Text>
        ) : null}
      </View>

      <ProgressBar
        progress={progress}
        accessibilityLabel={`Active calories, ${percent}% of ${calorieTarget} target`}
        style={styles.bar}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
  },
  value: { color: colors.text },
  unit: { color: colors.textMuted },
  percent: { color: colors.accentText },
  bar: { marginTop: spacing.md },
});
