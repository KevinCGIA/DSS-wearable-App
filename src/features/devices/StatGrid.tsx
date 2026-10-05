import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, type } from '@/theme';
import type { StatItem } from './deviceFormat';

type Props = {
  items: StatItem[];
  columns?: 2 | 3;
};

export function StatGrid({ items, columns = 3 }: Props) {
  const width = columns === 3 ? styles.third : styles.half;
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.cell, width]}
          accessible
          accessibilityLabel={`${item.label}: ${item.value}`}
        >
          <Text style={[type.statSmall, styles.value]} numberOfLines={2}>
            {item.value}
          </Text>
          <Text style={[type.caption, styles.label]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  cell: { paddingRight: spacing.sm },
  third: { width: '33.33%' },
  half: { width: '50%' },
  value: { color: colors.text },
  label: { color: colors.textMuted, marginTop: spacing.xxs },
});
