import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import type { DailyActivityExtras } from '@/data/types';
import { colors, spacing, type } from '@/theme';

type Props = {
  activity: DailyActivityExtras;
  onPress: () => void;
};

// Old Home calories card without the target, "% achieved" and goal bar (no fitness wording).
// No real source yet, so the real flow shows "--".
export function ActiveCaloriesCard({ activity, onPress }: Props) {
  const { activeCalories } = activity;

  return (
    <Card onPress={onPress} style={styles.card}>
      <CardTitle ionicon="flame-outline" title="Active Calories" />

      <View style={styles.row}>
        <Text style={[type.statLarge, styles.value]}>
          {activeCalories !== null ? activeCalories.toLocaleString() : '--'}
          <Text style={[type.unit, styles.unit]}> kcal</Text>
        </Text>
      </View>
      {activeCalories === null ? (
        <Text style={[type.caption, styles.unit]}>Not reported by connected devices yet.</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.lg },
  value: { color: colors.text },
  unit: { color: colors.textMuted },
});
