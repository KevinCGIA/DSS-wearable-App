import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, layout, radius } from '@/theme';

type Props = {
  progress: number;
  color?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function ProgressBar({ progress, color = colors.accent, accessibilityLabel, style }: Props) {
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={[styles.track, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      {clamped > 0 ? (
        <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: layout.progressHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
