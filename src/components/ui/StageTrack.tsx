import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

export type Segment = { start: number; width: number };

type Props = {
  label: string;
  duration: string;
  color: string;
  segments: Segment[];
  style?: ViewStyle;
};

export function StageTrack({ label, duration, color, segments, style }: Props) {
  return (
    <View style={style}>
      <View style={styles.head}>
        <View style={styles.key}>
          <View style={[styles.swatch, { backgroundColor: color }]} />
          <Text style={[type.label, styles.label]}>{label}</Text>
        </View>
        <Text style={[type.label, styles.duration]}>{duration}</Text>
      </View>
      <View style={styles.track}>
        {segments.map((segment, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                left: `${segment.start * 100}%`,
                width: `${segment.width * 100}%`,
                backgroundColor: color,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  key: { flexDirection: 'row', alignItems: 'center' },
  swatch: { width: 8, height: 8, borderRadius: radius.pill, marginRight: spacing.sm },
  label: { color: colors.textSecondary },
  duration: { color: colors.text },
  track: {
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.sleep.track,
    overflow: 'hidden',
  },
  segment: { position: 'absolute', top: 0, bottom: 0, borderRadius: radius.pill },
});
