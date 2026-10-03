import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, layout, radius } from '@/theme';

type Props = {
  uri: string | null;
  size?: number;
  loading?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Avatar({
  uri,
  size = layout.avatar,
  loading = false,
  onPress,
  accessibilityLabel = 'Profile picture',
}: Props) {
  const frame = { width: size, height: size, borderRadius: radius.pill };

  const body = loading ? (
    <View style={[styles.base, frame]}>
      <ActivityIndicator size="small" color={colors.accent} />
    </View>
  ) : uri ? (
    <Image source={{ uri }} style={[styles.base, frame]} />
  ) : (
    <View style={[styles.base, frame]}>
      <Text style={[styles.placeholder, { fontSize: size * 0.4 }]}>?</Text>
    </View>
  );

  if (!onPress) return body;

  const slop = Math.max(0, (layout.minTouch - size) / 2);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: { color: colors.textMuted, fontWeight: '600' },
  pressed: { opacity: 0.8 },
});
