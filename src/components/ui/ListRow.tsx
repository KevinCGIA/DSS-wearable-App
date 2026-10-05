import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  value?: string;
  hint?: string;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  divider?: boolean;
  right?: React.ReactNode;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function ListRow({
  label,
  icon,
  value,
  hint,
  onPress,
  chevron = Boolean(onPress),
  destructive = false,
  disabled = false,
  divider = false,
  right,
  accessibilityLabel,
  style,
}: Props) {
  const tint = destructive ? colors.danger : colors.text;

  const body = (
    <>
      {icon ? (
        <View style={[styles.badge, destructive && styles.badgeDanger]}>
          <Feather name={icon} size={layout.icon.row} color={destructive ? colors.danger : colors.accentText} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={[type.bodyStrong, { color: tint }]}>{label}</Text>
        {hint ? <Text style={[type.caption, styles.hint]}>{hint}</Text> : null}
      </View>
      {value ? (
        <Text style={[type.body, styles.value]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right}
      {chevron ? (
        <Feather name="chevron-right" size={layout.icon.action} color={colors.textMuted} style={styles.chevron} />
      ) : null}
    </>
  );

  const frame = [styles.row, divider && styles.divider, disabled && styles.disabled, style];

  if (!onPress) return <View style={frame}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [...frame, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
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
  disabled: { opacity: 0.5 },
  pressed: { backgroundColor: colors.surfaceSunken },
  badge: {
    width: layout.iconBadge,
    height: layout.iconBadge,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  badgeDanger: { backgroundColor: colors.dangerSurface },
  text: { flex: 1 },
  hint: { color: colors.textMuted, marginTop: spacing.xxs },
  value: { color: colors.textMuted, marginLeft: spacing.md, flexShrink: 1 },
  chevron: { marginLeft: spacing.sm },
});
