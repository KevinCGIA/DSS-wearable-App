import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  style?: ViewStyle;
};

export function SegmentedControl<T extends string>({ options, value, onChange, style }: Props<T>) {
  return (
    <View style={[styles.track, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text
              style={[
                type.subheading,
                { color: active ? colors.text : colors.textMuted },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: '#0E1B2A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
