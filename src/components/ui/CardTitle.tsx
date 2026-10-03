import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  title: string;
  icon?: keyof typeof Feather.glyphMap;
  ionicon?: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function CardTitle({ title, icon, ionicon, right, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.badge}>
        {ionicon ? (
          <Ionicons name={ionicon} size={17} color={colors.accentText} />
        ) : icon ? (
          <Feather name={icon} size={16} color={colors.accentText} />
        ) : null}
      </View>
      <Text style={[type.subheading, styles.title]} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    width: layout.iconBadge,
    height: layout.iconBadge,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: { flex: 1, color: colors.text, marginRight: spacing.sm },
});
