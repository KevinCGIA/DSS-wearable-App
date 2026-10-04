import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import type { Bucket } from '@/lib/trends';
import { formatHour, niceCeil, sixHourTicks } from '@/lib/trends';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  buckets: Bucket[];
  start: number;
  end: number;
  color?: string;
  height?: number;
  accessibilityLabel: string;
  style?: ViewStyle;
};

const formatAxis = (value: number) => (value >= 1000 ? `${value / 1000}k` : String(value));

export function TimeBarChart({
  buckets,
  start,
  end,
  color = colors.accent,
  height = layout.chartHeight,
  accessibilityLabel,
  style,
}: Props) {
  const peak = Math.max(0, ...buckets.map((b) => b.value ?? 0));
  const ceiling = niceCeil(peak);
  const span = end - start || 1;
  const ticks = sixHourTicks(start, end);

  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <View style={[styles.plotRow, { height }]}>
        <View style={styles.axis}>
          <Text style={[type.caption, styles.axisText]}>{formatAxis(ceiling)}</Text>
          <Text style={[type.caption, styles.axisText]}>0</Text>
        </View>
        <View style={styles.plot}>
          <View style={[styles.grid, styles.gridTop]} />
          <View style={[styles.grid, styles.gridMid]} />
          <View style={styles.bars}>
            {buckets.map((bucket) => (
              <View key={bucket.start} style={styles.slot}>
                {bucket.value ? (
                  <View
                    style={[
                      styles.bar,
                      { height: `${Math.max((bucket.value / ceiling) * 100, 3)}%`, backgroundColor: color },
                    ]}
                  />
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.ticks}>
        {ticks.map((t) => (
          <Text
            key={t}
            style={[type.caption, styles.tick, { left: `${((t - start) / span) * 100}%` }]}
            numberOfLines={1}
          >
            {formatHour(t)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plotRow: { flexDirection: 'row' },
  axis: { justifyContent: 'space-between', marginRight: spacing.sm, alignItems: 'flex-end', minWidth: spacing.xxl },
  axisText: { color: colors.textMuted },
  plot: { flex: 1, borderBottomWidth: 1, borderBottomColor: colors.border },
  grid: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  gridTop: { top: 0 },
  gridMid: { top: '50%' },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  slot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: radius.sm / 3, borderTopRightRadius: radius.sm / 3 },
  ticks: { height: spacing.xl, marginLeft: spacing.xxl + spacing.sm, marginTop: spacing.xs },
  tick: {
    position: 'absolute',
    color: colors.textMuted,
    width: spacing.huge + spacing.sm,
    marginLeft: -(spacing.huge + spacing.sm) / 2,
    textAlign: 'center',
  },
});
