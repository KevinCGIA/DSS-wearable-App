import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

// Title block for Screen's blue `hero`. Large title on tabs, back + heading on sub-screens.
export function HeroHeader({ title, subtitle, onBack, right }: Props) {
  return (
    <View>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={layout.hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Feather name="chevron-left" size={layout.icon.nav} color={colors.textOnAccent} />
          </Pressable>
        ) : null}
        <Text
          style={[onBack ? type.heading : type.title, styles.title]}
          numberOfLines={onBack ? 1 : 2}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {subtitle ? <Text style={[type.body, styles.subtitle]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.minTouch,
    marginTop: spacing.md,
  },
  back: {
    width: layout.minTouch,
    height: layout.minTouch,
    marginLeft: -spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.onAccentSurface },
  title: { flex: 1, color: colors.textOnAccent },
  right: { marginLeft: spacing.md },
  subtitle: { color: colors.textOnAccentMuted, marginTop: spacing.xs },
});
