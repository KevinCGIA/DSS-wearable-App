import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { formatAge, isSameDay, useNow } from "../services/sensors/time";
import { useLatestSensorReading } from "../services/sensors/useLatestSensorReading";

export const DAILY_STEP_GOAL = 10000;

type Props = {
  // "compact" is one line for the Home activity list,
  // "large" is the Fitness tab card with goal progress
  variant?: "compact" | "large";
};

export default function StepsDisplay({ variant = "compact" }: Props) {
  const { reading, loading, error } = useLatestSensorReading("steps");
  const now = useNow(60 * 1000);

  // Readings are a running total for their day, so one from before
  // midnight means no steps have been recorded today yet
  const stepsToday =
    reading && isSameDay(reading.timestamp, new Date(now))
      ? Math.round(reading.value)
      : 0;

  if (variant === "compact") {
    if (loading) {
      return <ActivityIndicator size="small" style={Styles.compactSpinner} />;
    }

    return (
      <Text style={Styles.compact}>
        👟 {error ? "--" : stepsToday.toLocaleString()} Steps
      </Text>
    );
  }

  const progress = Math.min(stepsToday / DAILY_STEP_GOAL, 1);

  return (
    <View style={Styles.container}>
      <Text style={Styles.title}>👟 Steps Today</Text>

      {loading ? (
        <ActivityIndicator style={Styles.spinner} />
      ) : error ? (
        <Text style={Styles.message}>{error}</Text>
      ) : (
        <>
          <Text style={Styles.value}>{stepsToday.toLocaleString()}</Text>

          <Text style={Styles.goal}>
            of {DAILY_STEP_GOAL.toLocaleString()} step goal
          </Text>

          <View style={Styles.progressTrack}>
            <View
              style={[
                Styles.progressFill,
                { width: `${progress * 100}%` },
                progress >= 1 && Styles.progressDone,
              ]}
            />
          </View>

          <Text style={Styles.message}>
            {!reading
              ? "No step data yet. Connect your wearable to start tracking."
              : progress >= 1
                ? "🎉 Goal reached!"
                : `Updated ${formatAge(now - reading.timestamp.getTime())}`}
          </Text>
        </>
      )}
    </View>
  );
}

const Styles = StyleSheet.create({
  compact: {
    fontSize: 16,
    marginBottom: 8,
  },

  compactSpinner: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },

  container: {
    alignItems: "center",
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
  },

  spinner: {
    marginVertical: 20,
  },

  value: {
    fontSize: 64,
    fontWeight: "bold",
    marginTop: 5,
  },

  goal: {
    fontSize: 14,
    color: "#666",
  },

  progressTrack: {
    alignSelf: "stretch",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ddd",
    marginTop: 15,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#208AEF",
  },

  progressDone: {
    backgroundColor: "green",
  },

  message: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
});
