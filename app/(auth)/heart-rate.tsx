import { Alert, Button, ScrollView, StyleSheet, Text, View } from "react-native";

import { getAuth } from "@react-native-firebase/auth";

import HeartRateDisplay from "../../components/HeartRateDisplay";
import SensorTrendChart from "../../components/SensorTrendChart";
import {
  addSampleDay,
  addSensorReading,
} from "../../services/sensors/readings";

export default function HeartRate() {
  // Development only: saves a random reading so the screen can be tested
  // without a wearable. __DEV__ is false in release builds.
  const addTestReading = async () => {
    const user = getAuth().currentUser;

    if (!user) {
      return;
    }

    try {
      await addSensorReading(user.uid, "heart_rate", {
        value: 60 + Math.floor(Math.random() * 40),
        source: "manual",
        deviceName: "Test data",
      });
    } catch (e: any) {
      Alert.alert("Error", "Failed to add test reading: " + e.message);
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
        <HeartRateDisplay variant="large" />
      </View>

      <SensorTrendChart type="heart_rate" />

      {__DEV__ && (
        <View style={Styles.devTools}>
          <Text style={Styles.devLabel}>Development</Text>

          <Button
            title="Add Test Reading"
            onPress={addTestReading}
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
