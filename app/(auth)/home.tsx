import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";

import {
  getAuth,
  signOut,
} from "@react-native-firebase/auth";

import {
  doc,
  getDoc,
  getFirestore,
} from "@react-native-firebase/firestore";

import {
  ActivityIndicator,
  Button,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import HeartRateDisplay from "../../components/HeartRateDisplay";
import StepsDisplay from "../../components/StepsDisplay";
import { activeConnections, useBle } from "../../services/ble/BleContext";
import {
  estimateActiveCalories,
  estimateDistanceKm,
  parseProfileNumber,
  useStepsToday,
} from "../../services/sensors/activity";

export default function Home() {
  const router = useRouter();
  const { connections } = useBle();
  const { steps } = useStepsToday();
  const [profilePictureData, setProfilePictureData] =
    useState("");
  const [name, setName] = useState("");
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);

  const active = activeConnections(connections);
  const connected = active.filter((c) => c.status === "connected");
  const onlyDevice = active.length === 1 ? active[0] : null;

  const [loading, setLoading] = useState(true);

  // Reload whenever Home comes back into view, so a name, weight or
  // picture changed in Settings shows up straight away
  useFocusEffect(
    useCallback(() => {
      loadProfilePicture();
    }, [])
  );

  const loadProfilePicture = async () => {
    try {
      const auth = getAuth();
      const firestore = getFirestore();
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      // Load the user's main profile
      const userDoc = await getDoc(
        doc(firestore, "users", user.uid)
      );

      let googleProfilePictureUrl = "";

      if (userDoc.exists()) {
        const userData = userDoc.data();
        googleProfilePictureUrl =
          userData?.profilePictureUrl || "";

        setName(userData?.name || "");
        setHeightCm(parseProfileNumber(userData?.height));
        setWeightKg(parseProfileNumber(userData?.weight));
      }

      const avatarDoc = await getDoc(
        doc(
          firestore,
          "users",
          user.uid,
          "private",
          "avatarData"
        )
      );

      if (avatarDoc.exists()) {
        const avatarData = avatarDoc.data();
        const customProfilePicture =
          avatarData?.imageData || "";

        if (customProfilePicture) {
          // Custom picture gets priority
          setProfilePictureData(customProfilePicture);
        } else {
          // Otherwise use Google profile picture
          setProfilePictureData(googleProfilePictureUrl);
        }
      } else {
        // No custom picture, so use Google profile picture
        setProfilePictureData(googleProfilePictureUrl);
      }
    } catch (e: any) {
      console.log(
        "Failed to load profile picture:",
        e
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (e: any) {
      alert("Logout failed: " + e.message);
    }
  };

  return (
    <View style={Styles.container}>

{/* Top bar */}
<View style={Styles.topBar}>
  <Text style={Styles.welcome}>
    {name ? `Welcome, ${name}!` : "Welcome!"}
  </Text>

  <Pressable
    onPress={() => router.push("/(auth)/settings")}
  >
    {loading ? (
      <ActivityIndicator size="small" />
    ) : profilePictureData ? (
      <Image
        source={{
          uri: profilePictureData,
        }}
        style={Styles.profilePicture}
      />
    ) : (
      <View style={Styles.profilePlaceholder}>
        <Text style={Styles.profilePlaceholderText}>
          ?
        </Text>
      </View>
    )}
  </Pressable>
</View>

      {/* Heart rate */}
      <View style={Styles.heartRate}>
        <HeartRateDisplay variant="compact" />
      </View>

      {/* Device and activity */}
      <View style={Styles.middleSection}>

        {/* Wearable - tap to scan and connect */}
        <Pressable
          style={Styles.deviceSection}
          onPress={() => router.push("/(auth)/devices")}
        >
          <View style={Styles.watchCircle}>
            <Text style={Styles.watchText}>
              {active.length === 0
                ? "No Device"
                : onlyDevice
                  ? onlyDevice.deviceName ?? "Unknown device"
                  : `${active.length} Devices`}
            </Text>
          </View>

          {active.length === 0 ? (
            <Text style={Styles.deviceStatusOff}>
              Tap to connect
            </Text>
          ) : connected.length === active.length ? (
            <Text style={Styles.deviceStatus}>
              ● Connected
            </Text>
          ) : (
            <Text style={Styles.deviceStatusPending}>
              {connected.length > 0
                ? `● ${connected.length} of ${active.length} connected`
                : "Connecting..."}
            </Text>
          )}

          {onlyDevice?.status === "connected" &&
            onlyDevice.batteryLevel !== null && (
              <Text style={Styles.battery}>
                🔋 {onlyDevice.batteryLevel}%
              </Text>
            )}
        </Pressable>

        {/* Activity */}
        <View style={Styles.activitySection}>
          <Text style={Styles.sectionTitle}>
            Activity
          </Text>

          <StepsDisplay variant="compact" />

          {/* Estimated from steps; no supported device reports distance.
              Floors are left out until a device provides them. */}
          <Text style={Styles.activityText}>
            🚶 {estimateDistanceKm(steps, heightCm).toFixed(1)} km
            <Text style={Styles.estimate}> est.</Text>
          </Text>
        </View>

      </View>

      {/* Sleep */}
      <View style={Styles.card}>
        <Text style={Styles.cardTitle}>
          😴 Sleep
        </Text>

        <View style={Styles.sleepRow}>
          <View>
            {/* No sleep data source yet */}
            <Text style={Styles.sleepValue}>
              --
            </Text>

            <Text style={Styles.smallText}>
              Sleep Duration
            </Text>
          </View>

          <View>
            <Text style={Styles.sleepScore}>
              --
            </Text>

            <Text style={Styles.smallText}>
              Sleep Score
            </Text>
          </View>
        </View>
      </View>

      {/* Active calories */}
      <View style={Styles.card}>
        <Text style={Styles.cardTitle}>
          🔥 Active Calories
        </Text>

        <Text style={Styles.calorieValue}>
          {Math.round(estimateActiveCalories(steps, weightKg))} kcal
          <Text style={Styles.estimate}> est.</Text>
        </Text>

        <Text style={Styles.smallText}>
          Estimated from today's steps
          {weightKg ? "" : ". Add your weight in Settings for a better estimate."}
        </Text>
      </View>

      {/* Development logout button */}
      <View style={Styles.logoutButton}>
        <Button
          title="Log Out"
          onPress={logout}
        />
      </View>

    </View>
  );
}

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  welcome: {
    fontSize: 24,
    fontWeight: "bold",
  },

  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },

  profilePlaceholderText: {
    fontSize: 20,
    color: "#777",
  },

  heartRate: {
    alignItems: "center",
    marginTop: 25,
  },

  middleSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 20,
  },

  deviceSection: {
    alignItems: "center",
    flex: 1,
  },

  watchCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },

  watchText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 10,
  },

  deviceStatus: {
    marginTop: 8,
    fontSize: 14,
    color: "green",
  },

  deviceStatusOff: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },

  deviceStatusPending: {
    marginTop: 8,
    fontSize: 14,
    color: "#b26a00",
  },

  battery: {
    marginTop: 4,
    fontSize: 14,
  },

  activitySection: {
    flex: 1,
    marginLeft: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  estimate: {
    fontSize: 13,
    fontWeight: "normal",
    color: "#888",
  },

  activityText: {
    fontSize: 16,
    marginBottom: 8,
  },

  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 10,
  },

  sleepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  sleepValue: {
    fontSize: 24,
    fontWeight: "bold",
  },

  sleepScore: {
    fontSize: 24,
    fontWeight: "bold",
  },

  smallText: {
    color: "#666",
    marginTop: 3,
  },

  calorieValue: {
    fontSize: 24,
    fontWeight: "bold",
  },

  logoutButton: {
    marginTop: 20,
    marginBottom: 20,
  },
});