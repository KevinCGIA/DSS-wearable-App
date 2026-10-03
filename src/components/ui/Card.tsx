import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, elevation, radius, spacing } from '@/theme';

type Variant = 'plain' | 'accent' | 'sunken';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
};

export function Card({ children, variant = 'plain', onPress, style, padding = spacing.xl }: Props) {
  const body = (pressed: boolean): ViewStyle[] => [
    styles.base,
    styles[variant],
    { padding },
    pressed ? styles.pressed : null,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (!onPress) return <View style={body(false)}>{children}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => body(pressed)}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  plain: {},
  accent: {
    backgroundColor: colors.accentSurface,
    borderColor: colors.accentBorder,
  },
  sunken: {
    backgroundColor: colors.surfaceSunken,
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
