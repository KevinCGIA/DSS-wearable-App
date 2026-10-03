import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, layout, radius } from '@/theme';

type Variant = 'filled' | 'outlined';

type Props = {
  accessibilityLabel: string;
  onPress?: () => void;
  icon?: keyof typeof Feather.glyphMap;
  glyph?: string;
  variant?: Variant;
  spinning?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function IconButton({
  accessibilityLabel,
  onPress,
  icon,
  glyph,
  variant = 'filled',
  spinning = false,
  disabled = false,
  style,
}: Props) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spinning) {
      rotation.stopAnimation();
      rotation.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spinning, rotation]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const tint = disabled ? colors.disabledText : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, busy: spinning }}
      style={({ pressed }) => [
        styles.base,
        variant === 'outlined' ? styles.outlined : styles.filled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Feather name={icon} size={18} color={tint} />
        </Animated.View>
      ) : (
        <Text style={[styles.glyph, { color: tint }]} maxFontSizeMultiplier={1.2}>
          {glyph}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: layout.minTouch,
    height: layout.minTouch,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceSunken },
  glyph: { fontFamily: fonts.uiBold, fontSize: 17 },
});
