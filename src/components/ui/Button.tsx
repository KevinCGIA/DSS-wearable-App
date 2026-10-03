import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Feather.glyphMap;
  ionicon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const surfaces: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
};

const labelColors: Record<Variant, string> = {
  primary: colors.textOnAccent,
  secondary: colors.text,
  ghost: colors.accentText,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  ionicon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: Props) {
  const inactive = disabled || loading;
  const tint = inactive && variant === 'primary' ? colors.disabledText : labelColors[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        surfaces[variant],
        fullWidth && styles.fullWidth,
        inactive && variant !== 'ghost' && styles.inactive,
        pressed && !inactive && (variant === 'primary' ? styles.pressedPrimary : styles.pressedSoft),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tint} />
      ) : (
        <View style={styles.row}>
          {icon ? <Feather name={icon} size={18} color={tint} style={styles.icon} /> : null}
          {ionicon ? <Ionicons name={ionicon} size={18} color={tint} style={styles.icon} /> : null}
          <Text style={[type.subheading, { color: tint }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  md: { height: 44 },
  lg: { height: 54 },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  inactive: { backgroundColor: colors.disabledSurface, borderColor: colors.disabledSurface },
  pressedPrimary: { backgroundColor: colors.accentPressed, borderColor: colors.accentPressed },
  pressedSoft: { backgroundColor: colors.accentSurface },
});
