import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, layout, radius, spacing, type } from '@/theme';

type Tier = 'live' | 'session' | 'neutral' | 'alert' | 'warning' | 'good';

type Props = {
  label: string;
  tier?: Tier;
  icon?: keyof typeof Feather.glyphMap;
  dot?: boolean;
  shape?: 'pill' | 'square';
  style?: ViewStyle;
};

const tiers: Record<Tier, { bg: string; fg: string; border: string }> = {
  live: { bg: colors.live.surfaceSoft, fg: colors.live.textSoft, border: colors.live.border },
  session: { bg: colors.session.surface, fg: colors.session.text, border: colors.session.surface },
  neutral: { bg: colors.surfaceSunken, fg: colors.textSecondary, border: 'transparent' },
  alert: { bg: colors.dangerSurface, fg: colors.danger, border: 'transparent' },
  warning: { bg: colors.warningSurface, fg: colors.warning, border: 'transparent' },
  good: { bg: colors.goodSurface, fg: colors.good, border: 'transparent' },
};

export function Pill({ label, tier = 'neutral', icon, dot = false, shape = 'pill', style }: Props) {
  const t = tiers[tier];

  return (
    <View style={[styles.base, shape === 'square' && styles.square, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.fg }]} /> : null}
      {icon ? <Feather name={icon} size={layout.icon.inline} color={t.fg} style={styles.icon} /> : null}
      <Text style={[type.label, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  square: { borderRadius: radius.sm / 2 },
  dot: { width: 7, height: 7, borderRadius: radius.pill, marginRight: spacing.sm },
  icon: { marginRight: spacing.sm },
});
