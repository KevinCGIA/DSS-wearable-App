import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, layout, radius } from '@/theme';

type Props = {
  uri: string | null;
  name?: string;
  size?: number;
  loading?: boolean;
  statusDot?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

function initialsFor(name: string | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function Avatar({
  uri,
  name,
  size = layout.avatar,
  loading = false,
  statusDot = false,
  onPress,
  accessibilityLabel = 'Profile picture',
}: Props) {
  const frame = { width: size, height: size, borderRadius: radius.pill };
  const initials = initialsFor(name);

  const face = loading ? (
    <View style={[styles.base, frame]}>
      <ActivityIndicator size="small" color={colors.accent} />
    </View>
  ) : uri ? (
    <Image source={{ uri }} style={[styles.base, frame]} />
  ) : (
    <View style={[styles.base, initials !== '?' && styles.initialsBase, frame]}>
      <Text
        style={[
          styles.initials,
          initials === '?' && styles.placeholder,
          { fontSize: size * (initials.length > 1 ? 0.36 : 0.4) },
        ]}
        maxFontSizeMultiplier={1}
      >
        {initials}
      </Text>
    </View>
  );

  const body = (
    <View>
      {face}
      {statusDot ? <View style={styles.dot} /> : null}
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
  initialsBase: { backgroundColor: colors.accentSurface, borderColor: colors.accentBorder },
  initials: { fontFamily: fonts.uiBold, color: colors.accentText },
  placeholder: { color: colors.textMuted },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: layout.statusDot,
    height: layout.statusDot,
    borderRadius: radius.pill,
    backgroundColor: colors.online,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
});
