import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { formatAge, useNow } from "../services/sensors/time";
import { useLatestSensorReading } from "../services/sensors/useLatestSensorReading";

// A reading older than this is shown greyed out as "last reading"
const STALE_AFTER_MS = 10 * 60 * 1000;
// A reading newer than this gets a "Live" badge. Readings are saved once a
// minute (HEART_RATE_SAVE_INTERVAL_MS), so allow a bit more than that.
const LIVE_WITHIN_MS = 2 * 60 * 1000;

type Props = {
  // "compact" for the Home dashboard, "large" for the Heart Rate tab
  variant?: "compact" | "large";
};

export default function HeartRateDisplay({ variant = "compact" }: Props) {
  const { reading, loading, error } = useLatestSensorReading("heart_rate");
  const now = useNow(30 * 1000);
  const large = variant === "large";

  if (loading) {
    return (
      <View style={Styles.container}>
        <Title large={large} />
        <ActivityIndicator style={Styles.spinner} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={Styles.container}>
        <Title large={large} />
        <Text style={Styles.message}>{error}</Text>
      </View>
    );
  }

  if (!reading) {
    return (
      <View style={Styles.container}>
        <Title large={large} />
        <Text style={[Styles.value, large && Styles.valueLarge, Styles.muted]}>
          --
        </Text>
        <Text style={Styles.unit}>BPM</Text>
        <Text style={Styles.message}>
          No readings yet. Connect your wearable to start tracking.
        </Text>
      </View>
    );
  }

  const age = now - reading.timestamp.getTime();
  const isStale = age > STALE_AFTER_MS;
  const isLive = age <= LIVE_WITHIN_MS;

  return (
    <View style={Styles.container}>
      <Title large={large} />

      <Text
        style={[
          Styles.value,
          large && Styles.valueLarge,
          isStale && Styles.muted,
        ]}
      >
        {Math.round(reading.value)}
      </Text>

      <Text style={Styles.unit}>BPM</Text>

      <View style={Styles.statusRow}>
        {isLive && <Text style={Styles.live}>● Live</Text>}

        <Text style={Styles.updated}>
          {isStale ? "Last reading " : "Updated "}
          {formatAge(age)}
        </Text>
      </View>

      {large && reading.deviceName && (
        <Text style={Styles.device}>from {reading.deviceName}</Text>
      )}
    </View>
  );
}

function Title({ large }: { large: boolean }) {
  return (
    <Text style={[Styles.title, large && Styles.titleLarge]}>
      ❤️ Heart Rate
    </Text>
  );
}

const Styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
  },

  titleLarge: {
    fontSize: 24,
  },

  spinner: {
    marginVertical: 20,
  },

  value: {
    fontSize: 42,
    fontWeight: "bold",
    marginTop: 5,
  },

  valueLarge: {
    fontSize: 96,
  },

  muted: {
    color: "#999",
  },

  unit: {
    fontSize: 14,
    color: "#666",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  live: {
    fontSize: 13,
    color: "green",
    marginRight: 8,
  },

  updated: {
    fontSize: 13,
    color: "#666",
  },

  device: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },

  message: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
});
