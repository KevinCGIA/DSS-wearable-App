import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

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

export default function Home() {
  const router = useRouter();
  const [profilePictureData, setProfilePictureData] =
    useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfilePicture();
  }, []);

  const loadProfilePicture = async () => {
    try {
      const auth = getAuth();
      const firestore = getFirestore();
      const user = auth.currentUser;

      if (!user) {
        return;
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

        setProfilePictureData(
          avatarData?.imageData || ""
        );
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
    Welcome!
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
        <Text style={Styles.heartRateTitle}>
          ❤️ Heart Rate
        </Text>

        <Text style={Styles.heartRateValue}>
          72
        </Text>

        <Text style={Styles.heartRateUnit}>
          BPM
        </Text>
      </View>

      {/* Device and activity */}
      <View style={Styles.middleSection}>

        {/* Galaxy Watch */}
        <View style={Styles.deviceSection}>
          <View style={Styles.watchCircle}>
            <Text style={Styles.watchText}>
              Galaxy
            </Text>

            <Text style={Styles.watchText}>
              Watch 8
            </Text>
          </View>

          <Text style={Styles.deviceStatus}>
            ● Connected
          </Text>

          <Text style={Styles.battery}>
            🔋 85%
          </Text>
        </View>

        {/* Activity */}
        <View style={Styles.activitySection}>
          <Text style={Styles.sectionTitle}>
            Activity
          </Text>

          <Text style={Styles.activityText}>
            👟 6,842 Steps
          </Text>

          <Text style={Styles.activityText}>
            🚶 4.8 km
          </Text>

          <Text style={Styles.activityText}>
            🪜 12 Floors
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
            <Text style={Styles.sleepValue}>
              7h 42m
            </Text>

            <Text style={Styles.smallText}>
              Sleep Duration
            </Text>
          </View>

          <View>
            <Text style={Styles.sleepScore}>
              86/100
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
          486 kcal
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

  heartRateTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  heartRateValue: {
    fontSize: 42,
    fontWeight: "bold",
    marginTop: 5,
  },

  heartRateUnit: {
    fontSize: 14,
    color: "#666",
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
  },

  deviceStatus: {
    marginTop: 8,
    fontSize: 14,
    color: "green",
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