import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type Props = {
  bars: 1 | 2 | 3 | 4;
};

const HEIGHTS = [0.35, 0.55, 0.78, 1];

export function SignalBars({ bars }: Props) {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {HEIGHTS.map((h, i) => (
        <View
          key={h}
          style={[styles.bar, { height: `${h * 100}%`, backgroundColor: i < bars ? colors.accent : colors.border }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', height: spacing.md + 2, gap: spacing.xxs },
  bar: { width: spacing.xs, borderRadius: radius.pill },
});
