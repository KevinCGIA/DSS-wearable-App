import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';

export type Bar = { label: string; value: number };

type Props = {
  data: Bar[];
  height?: number;
  max?: number;
  showValues?: boolean;
  colorFor?: (value: number) => string;
  highlightLast?: boolean;
  style?: ViewStyle;
};

function defaultColor(value: number): string {
  if (value >= 85) return colors.score.good;
  if (value >= 65) return colors.score.fair;
  return colors.score.poor;
}

export function BarChart({
  data,
  height = 132,
  max,
  showValues = true,
  colorFor = defaultColor,
  highlightLast = false,
  style,
}: Props) {
  const ceiling = max ?? Math.max(...data.map((bar) => bar.value), 1);

  return (
    <View style={style}>
      <View style={[styles.plot, { height }]}>
        {data.map((bar, index) => {
          const last = highlightLast && index === data.length - 1;
          return (
            <View key={bar.label} style={styles.column}>
              {showValues ? (
                <Text style={[type.axis, styles.value]}>{bar.value}</Text>
              ) : null}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max((bar.value / ceiling) * 100, 4)}%`,
                      backgroundColor: colorFor(bar.value),
                      opacity: highlightLast && !last ? 0.55 : 1,
                    },
                  ]}
                />
              </View>
              <Text style={[type.caption, styles.axis]} numberOfLines={1}>
                {bar.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'stretch' },
  column: { flex: 1, alignItems: 'center' },
  value: { color: colors.textMuted, marginBottom: spacing.xs },
  barTrack: { flex: 1, width: 12, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: radius.pill, minHeight: 6 },
  axis: { color: colors.textMuted, marginTop: spacing.sm },
});
