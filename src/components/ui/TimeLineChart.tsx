import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View, ViewStyle } from 'react-native';
import type { Bucket } from '@/lib/trends';
import { formatHour, sixHourTicks } from '@/lib/trends';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  buckets: Bucket[];
  start: number;
  end: number;
  color?: string;
  accessibilityLabel: string;
  style?: ViewStyle;
};

const STROKE = 2.5;

// Pads the range to the nearest 10 so the line never touches the edges.
function yRange(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const low = Math.floor((min - 5) / 10) * 10;
  const high = Math.ceil((max + 5) / 10) * 10;
  return [Math.max(0, low), high === low ? high + 10 : high];
}

// Line through bucket midpoints, drawn with rotated Views (no SVG dependency).
// A null bucket starts a new segment, so missing data shows as a gap (same as Android).
export function TimeLineChart({ buckets, start, end, color = colors.vital.pulse, accessibilityLabel, style }: Props) {
  const [width, setWidth] = useState(0);
  const height = layout.chartHeight;
  const values = buckets.map((b) => b.value).filter((v): v is number => v !== null);
  const [low, high] = values.length ? yRange(values) : [0, 1];
  const span = end - start || 1;

  const point = (b: Bucket) => ({
    x: (((b.start + b.end) / 2 - start) / span) * width,
    y: height - (((b.value ?? low) - low) / (high - low)) * height,
  });

  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const dots: { x: number; y: number }[] = [];
  buckets.forEach((b, i) => {
    if (b.value === null) return;
    const p = point(b);
    dots.push(p);
    const next = buckets[i + 1];
    if (next && next.value !== null) {
      const q = point(next);
      segments.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y });
    }
  });

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <View style={styles.plotRow}>
        <View style={styles.axis}>
          <Text style={[type.axis, styles.axisText]}>{high}</Text>
          <Text style={[type.axis, styles.axisText]}>{low}</Text>
        </View>
        <View style={[styles.plot, { height }]} onLayout={onLayout}>
          <View style={[styles.grid, styles.gridTop]} />
          <View style={[styles.grid, styles.gridMid]} />
          {width > 0 &&
            segments.map((s, i) => {
              const dx = s.x2 - s.x1;
              const dy = s.y2 - s.y1;
              const length = Math.hypot(dx, dy);
              return (
                <View
                  key={`s${i}`}
                  style={[
                    styles.segment,
                    {
                      width: length,
                      left: (s.x1 + s.x2) / 2 - length / 2,
                      top: (s.y1 + s.y2) / 2 - STROKE / 2,
                      backgroundColor: color,
                      transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                    },
                  ]}
                />
              );
            })}
          {width > 0 &&
            dots.map((d, i) => (
              <View
                key={`d${i}`}
                style={[styles.dot, { left: d.x - STROKE / 2, top: d.y - STROKE / 2, backgroundColor: color }]}
              />
            ))}
        </View>
      </View>
      <View style={styles.ticks}>
        {sixHourTicks(start, end).map((t) => (
          <Text key={t} style={[type.axis, styles.tick, { left: `${((t - start) / span) * 100}%` }]} numberOfLines={1}>
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
  segment: { position: 'absolute', height: STROKE, borderRadius: radius.pill },
  dot: { position: 'absolute', width: STROKE, height: STROKE, borderRadius: radius.pill },
  ticks: { height: spacing.xl, marginLeft: spacing.xxl + spacing.sm, marginTop: spacing.xs },
  tick: {
    position: 'absolute',
    color: colors.textMuted,
    width: spacing.huge + spacing.sm,
    marginLeft: -(spacing.huge + spacing.sm) / 2,
    textAlign: 'center',
  },
});
