import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, layout, radius, spacing, type } from '@/theme';

type Tone = 'error' | 'warning' | 'info' | 'success';

type Props = {
  message: string;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

const tones: Record<Tone, { bg: string; fg: string; icon: keyof typeof Feather.glyphMap }> = {
  error: { bg: colors.dangerSurface, fg: colors.danger, icon: 'alert-circle' },
  warning: { bg: colors.warningSurface, fg: colors.warning, icon: 'alert-triangle' },
  info: { bg: colors.accentSurface, fg: colors.accentText, icon: 'info' },
  success: { bg: colors.goodSurface, fg: colors.good, icon: 'check-circle' },
};

export function ErrorBanner({ message, tone = 'error', actionLabel, onAction, style }: Props) {
  const t = tones[tone];

  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }, style]} accessibilityRole="alert">
      <Feather name={t.icon} size={16} color={t.fg} style={styles.icon} />
      <Text style={[type.bodyStrong, styles.message, { color: t.fg }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={styles.action}
        >
          <Text style={[type.label, { color: t.fg }, styles.actionText]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  icon: { marginTop: 3 },
  message: { flex: 1, marginLeft: spacing.md },
  action: {
    marginLeft: spacing.md,
    minHeight: layout.minTouch,
    marginVertical: -spacing.md,
    justifyContent: 'center',
  },
  actionText: { textDecorationLine: 'underline' },
});
