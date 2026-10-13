import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, layout, radius, spacing } from '@/theme';

const SHAPE = [0.35, 0.55, 0.4, 0.8, 1, 0.6, 0.3, 0.45, 0.7, 0.95, 0.55, 0.35, 0.5, 0.85, 0.6, 0.4, 0.3, 0.5];

type Props = {
  active: boolean;
  color?: string;
  style?: ViewStyle;
};

export function Waveform({ active, color = colors.accent, style }: Props) {
  const phase = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const animate = active && !reduceMotion;

  useEffect(() => {
    if (!animate) {
      phase.stopAnimation();
      phase.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(phase, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(phase, { toValue: 0, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, phase]);

  return (
    <View style={[styles.row, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {SHAPE.map((height, index) => {
        const scaleY = phase.interpolate({
          inputRange: [0, 1],
          outputRange: index % 2 === 0 ? [1, 0.55] : [0.6, 1],
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: `${height * 100}%`,
                backgroundColor: color,
                opacity: active ? 1 : 0.35,
                transform: [{ scaleY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: layout.waveformHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  bar: { width: spacing.xs, borderRadius: radius.pill },
});
