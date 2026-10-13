import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { CardTitle } from "@/components/ui/CardTitle";
import { Pill } from "@/components/ui/Pill";
import { StatReadout } from "@/components/ui/StatReadout";
import { TimeBarChart } from "@/components/ui/TimeBarChart";
import { TimeLineChart } from "@/components/ui/TimeLineChart";
import type { Preferences, SensorType } from "@/data/types";
import { formatMetric } from "@/lib/biometrics/metrics";
import { formatAge, STALE_AFTER_MS } from "@/lib/time";
import { colors, spacing, type } from "@/theme";
import type {
  LiveVital,
  SpotVital,
  TotalVital,
  VitalValue,
  VitalView,
} from "./vitalsModel";

type Props = {
  now: number;
  vital: VitalView;
  units: Preferences["units"];
  first?: boolean;
};

// One vital for the selected source: live (24 h), spot (7 days) or running total (today).
export function VitalCard({ now, vital, units, first = false }: Props) {
  const range =
    vital.kind === "live" ? "24 h" : vital.kind === "spot" ? "7 days" : "Today";
  return (
    <Card style={first ? undefined : styles.card}>
      <CardTitle
        icon={vital.metric.icon}
        title={vital.metric.label}
        right={<Pill label={range} tier="neutral" />}
      />
      {vital.kind === "live" ? (
        <LiveBody now={now} vital={vital} units={units} />
      ) : vital.kind === "spot" ? (
        <SpotBody now={now} vital={vital} units={units} />
      ) : (
        <TotalBody now={now} vital={vital} units={units} />
      )}
    </Card>
  );
}

function display(
  type: SensorType,
  value: VitalValue | { value: number; secondary: number | null },
  units: Props["units"],
) {
  const main = formatMetric(type, value.value, units);
  if (value.secondary === null) return main;
  // Blood pressure: systolic/diastolic
  return {
    value: `${main.value}/${formatMetric(type, value.secondary, units).value}`,
    unit: main.unit,
  };
}

// long units don't fit three across; the headline already shows them
const statUnit = (unit: string) => (unit.length <= 3 ? unit : undefined);

function Hero({
  text,
  unit,
  caption,
  stale,
}: {
  text: string;
  unit: string;
  caption: string;
  stale: boolean;
}) {
  return (
    <View
      style={styles.center}
      accessible
      accessibilityLabel={`${text} ${unit}, ${caption}`}
    >
      <View style={styles.valueRow}>
        <Text
          style={[type.hero, styles.value, stale && styles.muted]}
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {text}
        </Text>
        {unit ? (
          <Text style={[type.unit, styles.unit, stale && styles.muted]}>
            {unit}
          </Text>
        ) : null}
      </View>
      <Text style={[type.label, stale ? styles.muted : styles.secondary]}>
        {caption}
      </Text>
    </View>
  );
}

function LiveBody({
  now,
  vital,
  units,
}: {
  now: number;
  vital: LiveVital;
  units: Props["units"];
}) {
  const age = now - vital.latest.timestamp.getTime();
  const latest = display(vital.type, vital.latest, units);
  const f = (value: number) => formatMetric(vital.type, value, units).value;
  const hasChart = vital.buckets.some((b) => b.value !== null);
  return (
    <>
      <Hero
        text={latest.value}
        unit={latest.unit}
        caption={`Updated ${formatAge(age)}`}
        stale={age > STALE_AFTER_MS}
      />
      <View style={styles.stats}>
        <StatReadout
          value={f(vital.stats.low)}
          unit={statUnit(latest.unit)}
          label="Min"
          size="medium"
          style={styles.stat}
        />
        <StatReadout
          value={f(vital.stats.average)}
          unit={statUnit(latest.unit)}
          label="Avg"
          size="medium"
          style={styles.stat}
        />
        <StatReadout
          value={f(vital.stats.high)}
          unit={statUnit(latest.unit)}
          label="Max"
          size="medium"
          style={styles.stat}
        />
      </View>
      {hasChart ? (
        <TimeLineChart
          buckets={vital.buckets}
          start={vital.start}
          end={vital.end}
          accessibilityLabel={`${vital.metric.label} over the last 24 hours: minimum ${f(vital.stats.low)}, average ${f(vital.stats.average)}, maximum ${f(vital.stats.high)} ${latest.unit}`}
          style={styles.chart}
        />
      ) : (
        <Text style={[type.caption, styles.muted, styles.note]}>
          No readings in the last 24 hours.
        </Text>
      )}
    </>
  );
}

function SpotBody({
  now,
  vital,
  units,
}: {
  now: number;
  vital: SpotVital;
  units: Props["units"];
}) {
  const age = now - vital.latest.timestamp.getTime();
  const latest = display(vital.type, vital.latest, units);
  const paired = vital.latest.secondary !== null;
  const average = display(
    vital.type,
    {
      value: vital.stats.average,
      secondary: paired ? vital.stats.secondaryAverage : null,
    },
    units,
  );
  const f = (value: number) => formatMetric(vital.type, value, units).value;
  return (
    <>
      <Hero
        text={latest.value}
        unit={latest.unit}
        caption={`Measured ${formatAge(age)}`}
        stale={false}
      />
      {vital.count > 1 ? (
        <View style={styles.stats}>
          {paired ? (
            // blood pressure: average pair and reading count
            <>
              <StatReadout
                value={average.value}
                unit={statUnit(latest.unit)}
                label="Average"
                size="medium"
                style={styles.stat}
              />
              <StatReadout
                value={vital.count}
                label="Readings"
                size="medium"
                style={styles.stat}
              />
            </>
          ) : (
            <>
              <StatReadout
                value={f(vital.stats.low)}
                unit={statUnit(latest.unit)}
                label="Low"
                size="medium"
                style={styles.stat}
              />
              <StatReadout
                value={average.value}
                unit={statUnit(latest.unit)}
                label="Avg"
                size="medium"
                style={styles.stat}
              />
              <StatReadout
                value={f(vital.stats.high)}
                unit={statUnit(latest.unit)}
                label="High"
                size="medium"
                style={styles.stat}
              />
            </>
          )}
        </View>
      ) : null}
      {vital.recent.length > 1 ? (
        <View style={styles.recent}>
          <Text style={[type.caption, styles.muted]}>Recent readings</Text>
          {vital.recent.map((reading, i) => {
            const value = display(vital.type, reading, units);
            return (
              <View
                key={`${reading.timestamp.getTime()}-${i}`}
                style={[styles.row, i > 0 && styles.rowDivider]}
              >
                <Text style={[type.body, styles.secondaryLeft]}>
                  {formatWhen(reading.timestamp, now)}
                </Text>
                <Text style={[type.bodyStrong, styles.value]}>
                  {value.value}
                  {value.unit ? ` ${value.unit}` : ""}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </>
  );
}

function TotalBody({
  now,
  vital,
  units,
}: {
  now: number;
  vital: TotalVital;
  units: Props["units"];
}) {
  const age = now - vital.latest.timestamp.getTime();
  const today = formatMetric(vital.type, vital.today, units);
  const hasBars = vital.buckets.some((b) => (b.value ?? 0) > 0);
  // bars in display units (distance is stored in metres)
  const buckets = vital.buckets.map((b) => ({
    ...b,
    value:
      b.value === null
        ? null
        : Number(
            formatMetric(vital.type, b.value, units).value.replace(/,/g, ""),
          ),
  }));
  return (
    <>
      <Hero
        text={today.value}
        unit={today.unit}
        caption={`Today · updated ${formatAge(age)}`}
        stale={false}
      />
      {hasBars ? (
        <TimeBarChart
          buckets={buckets}
          start={vital.start}
          end={vital.end}
          accessibilityLabel={`${vital.metric.label} per hour today: ${today.value} ${today.unit} in total`}
          style={styles.chart}
        />
      ) : (
        <Text style={[type.caption, styles.muted, styles.note]}>
          Nothing recorded yet today.
        </Text>
      )}
    </>
  );
}

function formatWhen(date: Date, now: number) {
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const today = new Date(now).toDateString() === date.toDateString();
  if (today) return `Today, ${time}`;
  const yesterday =
    new Date(now - 86400000).toDateString() === date.toDateString();
  if (yesterday) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}, ${time}`;
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  center: { alignItems: "center", marginTop: spacing.lg },
  valueRow: { flexDirection: "row", alignItems: "baseline", maxWidth: "100%" },
  value: { color: colors.text },
  unit: { color: colors.textSecondary, marginLeft: spacing.xs },
  muted: { color: colors.textMuted },
  secondary: { color: colors.textSecondary, textAlign: "center" },
  secondaryLeft: { color: colors.textSecondary, flexShrink: 1 },
  stats: { flexDirection: "row", marginTop: spacing.lg },
  stat: { flex: 1 },
  chart: { marginTop: spacing.lg },
  note: { textAlign: "center", marginTop: spacing.lg },
  recent: { marginTop: spacing.lg },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
