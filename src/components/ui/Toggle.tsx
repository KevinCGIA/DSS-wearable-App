import React from 'react';
import { StyleSheet, Switch, Text, View, ViewStyle } from 'react-native';
import { colors, layout, spacing, type } from '@/theme';

type Props = {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  hint?: string;
  disabled?: boolean;
  divider?: boolean;
  style?: ViewStyle;
};

export function Toggle({ label, value, onValueChange, hint, disabled = false, divider = false, style }: Props) {
  return (
    <View style={[styles.row, divider && styles.divider, style]}>
      <View style={styles.text}>
        <Text style={[type.bodyStrong, styles.label]}>{label}</Text>
        {hint ? <Text style={[type.caption, styles.hint]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
        accessibilityHint={hint}
        trackColor={{ false: colors.disabledSurface, true: colors.accent }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.disabledSurface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.rowHeight,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  text: { flex: 1, marginRight: spacing.md },
  label: { color: colors.text },
  hint: { color: colors.textMuted, marginTop: spacing.xxs },
});
