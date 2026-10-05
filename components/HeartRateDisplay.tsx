import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useLiveHeartRate } from "../services/ble/BleContext";
import { formatAge, useNow } from "../services/sensors/time";
import { useLatestSensorReading } from "../services/sensors/useLatestSensorReading";

// A saved reading older than this is shown greyed out as "last reading"
const STALE_AFTER_MS = 10 * 60 * 1000;
// Bluetooth heart rate monitors send about one value a second. If the
// newest one is older than this, the device has stopped sending (taken off,
// out of range) and the display falls back to the latest saved reading.
const LIVE_TIMEOUT_MS = 10 * 1000;

type Props = {
  // "compact" for the Home dashboard, "large" for the Heart Rate tab
  variant?: "compact" | "large";
};

export default function HeartRateDisplay({ variant = "compact" }: Props) {
  const { reading, loading, error } = useLatestSensorReading("heart_rate");
  const live = useLiveHeartRate();
  const now = useNow(5 * 1000);
  const large = variant === "large";

  // Straight from the connected device, updating every second
  if (live && Date.now() - live.receivedAt < LIVE_TIMEOUT_MS) {
    return (
      <View style={Styles.container}>
        <Title large={large} />

        <Text style={[Styles.value, large && Styles.valueLarge]}>
          {live.bpm}
        </Text>

        <Text style={Styles.unit}>BPM</Text>

        <View style={Styles.statusRow}>
          <Text style={Styles.live}>● Live</Text>
        </View>

        {large && live.deviceName && (
          <Text style={Styles.device}>from {live.deviceName}</Text>
        )}
      </View>
    );
  }

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
