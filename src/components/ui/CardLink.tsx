import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, layout, type } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  // Where it goes, when the label alone is ambiguous (several "Open in Activity" links).
  hint?: string;
  style?: ViewStyle;
};

// Text link at the end of an expanded card, e.g. "Open in Activity ›".
export function CardLink({ label, onPress, hint, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label.replace('›', '').trim()}
      accessibilityHint={hint}
      hitSlop={layout.hitSlop}
      style={({ pressed }) => [styles.link, pressed && styles.pressed, style]}
    >
      <Text style={[type.bodyStrong, styles.text]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: layout.minTouch, justifyContent: 'center', alignSelf: 'flex-start' },
  pressed: { opacity: 0.6 },
  text: { color: colors.accentText },
});
