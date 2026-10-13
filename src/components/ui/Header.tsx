import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function Header({ title, onBack, right, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={layout.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Feather name="chevron-left" size={layout.icon.nav} color={colors.text} />
        </Pressable>
      ) : null}
      <Text
        style={[type.heading, styles.title]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.minTouch,
    marginTop: spacing.sm,
  },
  back: {
    width: layout.minTouch,
    height: layout.minTouch,
    marginLeft: -spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surfaceSunken },
  title: { flex: 1, color: colors.text },
  right: { marginLeft: spacing.md },
});
