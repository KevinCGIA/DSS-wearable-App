import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getAuth,
  sendPasswordResetEmail,
  signOut,
  verifyBeforeUpdateEmail,
} from "@react-native-firebase/auth";

import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from "@react-native-firebase/firestore";

export default function Settings() {
  const [name, setName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [profilePictureData, setProfilePictureData] = useState("");
  const [loading, setLoading] = useState(true);

  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const auth = getAuth();
      const firestore = getFirestore();
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      // Load normal profile information
      const userDoc = await getDoc(
        doc(firestore, "users", user.uid)
      );

      if (userDoc.exists()) {
        const data = userDoc.data();

        setName(data?.name || "");
        setHeight(data?.height || "");
        setWeight(data?.weight || "");
      }

      // Load profile picture
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
      Alert.alert(
        "Error",
        "Failed to load profile: " + e.message
      );
    } finally {
      setLoading(false);
    }
  };

  const chooseProfilePicture = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photos to choose a profile picture."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

    if (!result.canceled) {
      try {
        const imageUri = result.assets[0].uri;

        const auth = getAuth();
        const firestore = getFirestore();
        const user = auth.currentUser;

        if (!user) {
          return;
        }

        // Resize and compress the image
        const manipulatedImage =
          await ImageManipulator.manipulateAsync(
            imageUri,
            [
              {
                resize: {
                  width: 300,
                  height: 300,
                },
              },
            ],
            {
              compress: 0.5,
              format:
                ImageManipulator.SaveFormat.JPEG,
            }
          );

        // Convert the image to Base64
        const base64Image =
          await FileSystem.readAsStringAsync(
            manipulatedImage.uri,
            {
              encoding:
                FileSystem.EncodingType.Base64,
            }
          );

        // Add the image format
        const imageData =
          `data:image/jpeg;base64,${base64Image}`;

        // Save the image in Firestore
        await setDoc(
          doc(
            firestore,
            "users",
            user.uid,
            "private",
            "avatarData"
          ),
          {
            imageData: imageData,
          }
        );

        // Show the new picture immediately
        setProfilePictureData(imageData);

        Alert.alert(
          "Success",
          "Profile picture updated successfully!"
        );
      } catch (e: any) {
        console.log(
          "Profile picture update failed:",
          e
        );

        Alert.alert(
          "Error",
          "Failed to update profile picture: " +
            e.message
        );
      }
    }
  };

  const saveProfile = async () => {
    try {
      const auth = getAuth();
      const firestore = getFirestore();
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      await updateDoc(
        doc(firestore, "users", user.uid),
        {
          name: name,
          height: height,
          weight: weight,
        }
      );

      Alert.alert(
        "Success",
        "Profile updated successfully!"
      );
    } catch (e: any) {
      Alert.alert(
        "Error",
        "Failed to update profile: " + e.message
      );
    }
  };

  const changeEmail = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    if (!newEmail.trim()) {
      Alert.alert(
        "Error",
        "Please enter your new email address."
      );
      return;
    }

    try {
      await verifyBeforeUpdateEmail(
        user,
        newEmail.trim()
      );

      Alert.alert(
        "Verification Email Sent",
        "Please check your new email address and click the verification link to complete the email change."
      );

      setNewEmail("");
    } catch (e: any) {
      console.log(
        "Change email failed:",
        e
      );

      Alert.alert(
        "Error",
        "Failed to change email: " + e.message
      );
    }
  };

  const changePassword = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      return;
    }

    try {
      await sendPasswordResetEmail(
        auth,
        user.email
      );

      Alert.alert(
        "Password Reset Email Sent",
        "Please check your email and click the password reset link to choose a new password."
      );
    } catch (e: any) {
      console.log(
        "Password reset failed:",
        e
      );

      Alert.alert(
        "Error",
        "Failed to send password reset email: " +
          e.message
      );
    }
  };

  const logout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              const auth = getAuth();

              await signOut(auth);
            } catch (e: any) {
              Alert.alert(
                "Error",
                "Logout failed: " + e.message
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={Styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={Styles.container}
    >
      <Text style={Styles.title}>
        Settings
      </Text>

      {profilePictureData ? (
        <Image
          source={{ uri: profilePictureData }}
          style={Styles.profilePicture}
        />
      ) : (
        <View
          style={
            Styles.profilePicturePlaceholder
          }
        >
          <Text
            style={Styles.profilePictureText}
          >
            ?
          </Text>
        </View>
      )}

      <View style={Styles.button}>
        <Button
          title="Change Profile Picture"
          onPress={chooseProfilePicture}
        />
      </View>

      <Text style={Styles.sectionTitle}>
        Profile
      </Text>

      <Text style={Styles.label}>
        Name
      </Text>

      <TextInput
        style={Styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />

      <Text style={Styles.label}>
        Height (cm)
      </Text>

      <TextInput
        style={Styles.input}
        value={height}
        onChangeText={setHeight}
        placeholder="Enter height in centimetres"
        keyboardType="numeric"
      />

      <Text style={Styles.label}>
        Weight (kg)
      </Text>

      <TextInput
        style={Styles.input}
        value={weight}
        onChangeText={setWeight}
        placeholder="Enter weight in kilograms"
        keyboardType="numeric"
      />

      <View style={Styles.button}>
        <Button
          title="Save Changes"
          onPress={saveProfile}
        />
      </View>

      <Text style={Styles.sectionTitle}>
        Account & Security
      </Text>

      <Text style={Styles.label}>
        New Email
      </Text>

      <TextInput
        style={Styles.input}
        value={newEmail}
        onChangeText={setNewEmail}
        placeholder="Enter your new email"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={Styles.button}>
        <Button
          title="Change Email"
          onPress={changeEmail}
        />
      </View>

      <View style={Styles.button}>
        <Button
          title="Change Password"
          onPress={changePassword}
        />
      </View>

      <Text style={Styles.sectionTitle}>
        Account
      </Text>

      <View style={Styles.button}>
        <Button
          title="Log Out"
          color="red"
          onPress={logout}
        />
      </View>
    </ScrollView>
  );
}

const Styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },

  label: {
    fontSize: 15,
    marginTop: 8,
    marginBottom: 4,
  },

  input: {
    height: 45,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#fff",
  },

  button: {
    marginTop: 12,
  },

  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 20,
  },

  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 20,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },

  profilePictureText: {
    fontSize: 40,
    color: "#777",
  },
});