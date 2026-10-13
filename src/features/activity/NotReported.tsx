import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { colors, spacing, type } from '@/theme';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  message: string;
  first?: boolean;
};

// A bio stat the selected source doesn't report. Never estimated.
export function NotReported({ icon, title, message, first = false }: Props) {
  return (
    <Card style={first ? undefined : styles.card}>
      <CardTitle icon={icon} title={title} />
      <Text style={[type.body, styles.text]}>{message}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  text: { color: colors.textMuted, marginTop: spacing.md },
});
