import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { SensorType } from "../services/sensors/schema";
import {
  averageByBucket,
  Bucket,
  stepsByBucket,
} from "../services/sensors/trends";
import { useSensorHistory } from "../services/sensors/useSensorHistory";

const HOURS = 24;
const CHART_HEIGHT = 180;
const PADDING = { top: 10, right: 8, bottom: 22, left: 36 };

type ChartConfig = {
  title: string;
  color: string;
  bucketMs: number;
  kind: "line" | "bar";
  emptyText: string;
};

const CONFIG: Record<SensorType, ChartConfig> = {
  heart_rate: {
    title: "Heart Rate · Last 24 Hours",
    color: "#e5484d",
    bucketMs: 15 * 60 * 1000,
    kind: "line",
    emptyText: "No heart rate readings in the last 24 hours.",
  },
  steps: {
    title: "Steps per Hour · Last 24 Hours",
    color: "#208AEF",
    bucketMs: 60 * 60 * 1000,
    kind: "bar",
    emptyText: "No step data in the last 24 hours.",
  },
};

export default function SensorTrendChart({ type }: { type: SensorType }) {
  const config = CONFIG[type];
  const { readings, start, end, loading, error } = useSensorHistory(
    type,
    HOURS
  );
  const [width, setWidth] = useState(0);

  const buckets = useMemo(
    () =>
      type === "steps"
        ? stepsByBucket(readings, start, end, config.bucketMs)
        : averageByBucket(readings, start, end, config.bucketMs),
    [type, readings, start, end, config.bucketMs]
  );

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const hasData = readings.length > 0;

  return (
    <View style={Styles.card} onLayout={onLayout}>
      <Text style={Styles.title}>{config.title}</Text>

      {loading ? (
        <ActivityIndicator style={Styles.placeholder} />
      ) : error ? (
        <Text style={[Styles.placeholder, Styles.message]}>{error}</Text>
      ) : !hasData ? (
        <Text style={[Styles.placeholder, Styles.message]}>
          {config.emptyText}
        </Text>
      ) : (
        <>
          <Summary type={type} buckets={buckets} readings={readings} />

          {width > 0 && (
            <Chart
              width={width - 30}
              buckets={buckets}
              start={start}
              end={end}
              config={config}
            />
          )}
        </>
      )}
    </View>
  );
}

function Summary({
  type,
  buckets,
  readings,
}: {
  type: SensorType;
  buckets: Bucket[];
  readings: { value: number }[];
}) {
  if (type === "steps") {
    const total = buckets.reduce((sum, b) => sum + (b.value ?? 0), 0);

    return (
      <View style={Styles.summaryRow}>
        <Stat label="Total" value={Math.round(total).toLocaleString()} />
      </View>
    );
  }

  const values = readings.map((r) => r.value);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;

  return (
    <View style={Styles.summaryRow}>
      <Stat label="Min" value={`${Math.round(Math.min(...values))}`} />
      <Stat label="Avg" value={`${Math.round(average)}`} />
      <Stat label="Max" value={`${Math.round(Math.max(...values))}`} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={Styles.stat}>
      <Text style={Styles.statValue}>{value}</Text>
      <Text style={Styles.statLabel}>{label}</Text>
    </View>
  );
}

function Chart({
  width,
  buckets,
  start,
  end,
  config,
}: {
  width: number;
  buckets: Bucket[];
  start: number;
  end: number;
  config: ChartConfig;
}) {
  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const values = buckets
    .map((b) => b.value)
    .filter((v): v is number => v !== null);
  const [yMin, yMax] = yRange(values, config.kind);

  const x = (time: number) =>
    PADDING.left + ((time - start) / (end - start)) * plotWidth;
  const y = (value: number) =>
    PADDING.top + (1 - (value - yMin) / (yMax - yMin)) * plotHeight;

  const gridValues = [yMin, (yMin + yMax) / 2, yMax];

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      {gridValues.map((value) => (
        <Line
          key={`grid-${value}`}
          x1={PADDING.left}
          x2={PADDING.left + plotWidth}
          y1={y(value)}
          y2={y(value)}
          stroke="#ddd"
          strokeWidth={1}
        />
      ))}

      {gridValues.map((value) => (
        <SvgText
          key={`label-${value}`}
          x={PADDING.left - 6}
          y={y(value) + 4}
          fontSize={10}
          fill="#888"
          textAnchor="end"
        >
          {formatAxisValue(value)}
        </SvgText>
      ))}

      {timeTicks(start, end).map((time) => (
        <SvgText
          key={`time-${time}`}
          x={x(time)}
          y={CHART_HEIGHT - 6}
          fontSize={10}
          fill="#888"
          textAnchor="middle"
        >
          {formatHour(time)}
        </SvgText>
      ))}

      {config.kind === "bar"
        ? buckets.map((bucket) =>
            bucket.value ? (
              <Rect
                key={bucket.start}
                x={x(bucket.start) + 1}
                y={y(bucket.value)}
                width={Math.max(x(bucket.end) - x(bucket.start) - 2, 1)}
                height={y(yMin) - y(bucket.value)}
                rx={2}
                fill={config.color}
              />
            ) : null
          )
        : (
          <Path
            d={linePath(buckets, x, y)}
            stroke={config.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        )}
    </Svg>
  );
}

// Path through bucket midpoints. Starts a new segment after an empty
// bucket, so gaps in wear show as breaks in the line.
function linePath(
  buckets: Bucket[],
  x: (time: number) => number,
  y: (value: number) => number
) {
  let path = "";
  let drawing = false;

  buckets.forEach((bucket, i) => {
    if (bucket.value === null) {
      drawing = false;
      return;
    }

    const px = x((bucket.start + bucket.end) / 2);
    const py = y(bucket.value);
    const next = buckets[i + 1];

    if (drawing) {
      path += ` L ${px} ${py}`;
    } else if (next && next.value !== null) {
      path += ` M ${px} ${py}`;
      drawing = true;
    } else {
      // Isolated point: draw a tiny segment so it's visible as a dot
      path += ` M ${px - 1.5} ${py} L ${px + 1.5} ${py}`;
    }
  });

  return path.trim();
}

function yRange(values: number[], kind: "line" | "bar"): [number, number] {
  const max = Math.max(...values, 0);

  if (kind === "bar") {
    return [0, Math.max(niceCeil(max), 10)];
  }

  // Heart rate: pad around the data and round to tens
  const min = Math.min(...values);
  const low = Math.max(Math.floor((min - 5) / 10) * 10, 0);
  const high = Math.ceil((max + 5) / 10) * 10;
  return [low, high > low ? high : low + 10];
}

function niceCeil(value: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(value, 1))));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

// Labels on the hour every 6 hours (e.g. 12 AM, 6 AM, 12 PM, 6 PM)
function timeTicks(start: number, end: number) {
  const ticks: number[] = [];
  const tick = new Date(start);
  tick.setMinutes(0, 0, 0);

  while (tick.getTime() <= end) {
    if (tick.getTime() > start + 30 * 60 * 1000 && tick.getHours() % 6 === 0) {
      ticks.push(tick.getTime());
    }
    tick.setHours(tick.getHours() + 1);
  }

  return ticks;
}

function formatHour(time: number) {
  const hours = new Date(time).getHours();
  const suffix = hours < 12 ? "AM" : "PM";
  return `${hours % 12 === 0 ? 12 : hours % 12} ${suffix}`;
}

function formatAxisValue(value: number) {
  return value >= 1000
    ? `${Math.round(value / 100) / 10}k`
    : `${Math.round(value)}`;
}

const Styles = StyleSheet.create({
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
  },

  title: {
    fontSize: 16,
    fontWeight: "bold",
  },

  placeholder: {
    marginVertical: 30,
  },

  message: {
    color: "#666",
    textAlign: "center",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },

  stat: {
    alignItems: "center",
  },

  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },

  statLabel: {
    fontSize: 12,
    color: "#666",
  },
});
