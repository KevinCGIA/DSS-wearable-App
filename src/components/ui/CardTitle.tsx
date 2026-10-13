import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors, fonts, layout, spacing, type } from '@/theme';

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
      {ionicon ? (
        <Ionicons name={ionicon} size={layout.icon.action} color={colors.textSecondary} style={styles.icon} />
      ) : icon ? (
        <Feather name={icon} size={layout.icon.action} color={colors.textSecondary} style={styles.icon} />
      ) : null}
      <Text style={[type.subheading, styles.title]} numberOfLines={2}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  title: { flex: 1, color: colors.text, marginRight: spacing.sm, fontFamily: fonts.uiSemiBold },
});
