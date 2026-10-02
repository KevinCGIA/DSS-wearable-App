import { Alert, Button, ScrollView, StyleSheet, Text, View } from "react-native";

import { getAuth } from "@react-native-firebase/auth";

import SensorTrendChart from "../../components/SensorTrendChart";
import StepsDisplay from "../../components/StepsDisplay";
import {
  addSampleDay,
  addSensorReading,
} from "../../services/sensors/readings";
import { isSameDay } from "../../services/sensors/time";
import { useLatestSensorReading } from "../../services/sensors/useLatestSensorReading";

export default function Fitness() {
  const { reading } = useLatestSensorReading("steps");

  // Development only: adds a few hundred steps to today's running total.
  // __DEV__ is false in release builds.
  const addTestSteps = async () => {
    const user = getAuth().currentUser;

    if (!user) {
      return;
    }

    const today =
      reading && isSameDay(reading.timestamp, new Date())
        ? reading.value
        : 0;

    try {
      await addSensorReading(user.uid, "steps", {
        value: today + 200 + Math.floor(Math.random() * 600),
        source: "manual",
        deviceName: "Test data",
      });
    } catch (e: any) {
      Alert.alert("Error", "Failed to add test steps: " + e.message);
    }
  };

  const addSampleData = async () => {
    const user = getAuth().currentUser;

    if (!user) {
      return;
    }

    try {
      await addSampleDay(user.uid);
    } catch (e: any) {
      Alert.alert("Error", "Failed to add sample data: " + e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={Styles.container}>
      <View style={Styles.card}>
        <StepsDisplay variant="large" />
      </View>

      <SensorTrendChart type="steps" />

      {__DEV__ && (
        <View style={Styles.devTools}>
          <Text style={Styles.devLabel}>Development</Text>

          <Button
            title="Add Test Steps"
            onPress={addTestSteps}
          />

          <View style={Styles.devButton}>
            <Button
              title="Add 24h of Sample Data"
              onPress={addSampleData}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const Styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingVertical: 30,
  },

  devTools: {
    marginTop: 30,
  },

  devLabel: {
    fontSize: 12,
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 6,
  },

  devButton: {
    marginTop: 10,
  },
});
