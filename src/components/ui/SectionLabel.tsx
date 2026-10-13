import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, type } from '@/theme';

type Props = {
  title: string;
  // First thing under the header: 20 above instead of 24.
  first?: boolean;
  // e.g. a spinner while scanning.
  right?: React.ReactNode;
  style?: ViewStyle;
};

// The one section label: overline, flush with the card edge, 24 above and 8 below.
export function SectionLabel({ title, first = false, right, style }: Props) {
  return (
    <View style={[styles.row, first && styles.first, style]}>
      <Text style={[type.overline, styles.text]} accessibilityRole="header">
        {title.toUpperCase()}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  first: { marginTop: spacing.xl },
  text: { flex: 1, color: colors.textMuted },
});
