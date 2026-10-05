import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, layout, radius, spacing, type } from '@/theme';
import type { ActivitySource } from './activityModel';

type Props = {
  sources: ActivitySource[];
  selected: string | null;
  onSelect: (key: string) => void;
};

// Whose data the Activity tab shows. Names only: connection details live in the Devices tab.
export function SourceChips({ sources, selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroller}
      accessibilityLabel="Show data from"
    >
      {sources.map((source) => {
        const active = source.key === selected;
        return (
          <Pressable
            key={source.key}
            onPress={() => onSelect(source.key)}
            accessibilityRole="button"
            accessibilityLabel={`Show data from ${source.label}`}
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [styles.chip, active && styles.active, pressed && !active && styles.pressed]}
          >
            <Text
              style={[type.label, active ? styles.activeText : styles.text]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
            >
              {source.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Bleed to the screen edges so chips scroll under the padding.
  scroller: { marginHorizontal: -layout.screenPadding, marginTop: spacing.xl },
  row: { paddingHorizontal: layout.screenPadding, gap: spacing.sm },
  chip: {
    minHeight: layout.minTouch,
    maxWidth: layout.chipMaxWidth,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  active: { backgroundColor: colors.accent, borderColor: colors.accent },
  pressed: { backgroundColor: colors.surfaceSunken },
  text: { color: colors.text },
  activeText: { color: colors.textOnAccent },
});
