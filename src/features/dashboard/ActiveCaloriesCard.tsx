import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CardLink } from '@/components/ui/CardLink';
import { CardTitle } from '@/components/ui/CardTitle';
import { ExpandableCard } from '@/components/ui/ExpandableCard';
import { ExpandChevron } from '@/components/ui/ExpandChevron';
import type { DailyActivityExtras } from '@/data/types';
import { colors, spacing, type } from '@/theme';

type Props = {
  activity: DailyActivityExtras;
  initiallyExpanded?: boolean;
  onOpen: () => void;
};

// Old Home calories card without the target, "% achieved" and goal bar (no fitness wording).
// No real source yet, so the real flow shows "--".
export function ActiveCaloriesCard({ activity, initiallyExpanded, onOpen }: Props) {
  const { activeCalories } = activity;
  const reported = activeCalories !== null;

  return (
    <ExpandableCard
      style={styles.card}
      initiallyExpanded={initiallyExpanded}
      accessibilityLabel={reported ? `Active calories, ${activeCalories} kilocalories` : 'Active calories, not reported'}
      header={({ expanded }) => (
        <>
          <CardTitle ionicon="flame-outline" title="Active Calories" right={<ExpandChevron expanded={expanded} />} />
          <View style={styles.row}>
            <Text style={[type.statLarge, styles.value]}>
              {reported ? activeCalories.toLocaleString() : '--'}
              <Text style={[type.unit, styles.unit]}> kcal</Text>
            </Text>
          </View>
          {!reported ? <Text style={[type.caption, styles.unit]}>Not reported by connected devices yet.</Text> : null}
        </>
      )}
    >
      <Text style={[type.body, styles.source]}>
        {reported ? 'Reported by connected device' : 'Not reported by connected devices yet'}
      </Text>
      <CardLink label="Open Steps ›" onPress={onOpen} />
    </ExpandableCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.lg },
  value: { color: colors.text },
  unit: { color: colors.textMuted },
  source: { color: colors.textSecondary },
});
