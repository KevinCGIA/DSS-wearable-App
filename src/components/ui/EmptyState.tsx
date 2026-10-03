import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

export function EmptyState({ icon, title, message, actionLabel, onAction, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.icon}>
        <Feather name={icon} size={22} color={colors.accentText} />
      </View>
      <Text style={[type.subheading, styles.title]}>{title}</Text>
      {message ? <Text style={[type.body, styles.message]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="md"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xl },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { color: colors.text, textAlign: 'center' },
  message: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  action: { marginTop: spacing.lg },
});
