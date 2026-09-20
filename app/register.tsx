import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import {
    ActivityIndicator,
    Button,
    Image,
    KeyboardAvoidingView,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    sendEmailVerification,
    signInWithCredential,
    signOut,
} from "@react-native-firebase/auth";

import {
    doc,
    getFirestore,
    setDoc,
} from "@react-native-firebase/firestore";

import { GoogleSignin } from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId:
    "944450266341-4b3vg7vjptiv7c3sclicu54vhmd6oakr.apps.googleusercontent.com",
});

export default function Register() {
  const [name, setName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [loading, setLoading] = useState(false);

  const chooseProfilePicture = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert("Please allow access to your photos.");
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
  const imageUri = result.assets[0].uri;

  setProfilePicture(imageUri);

  console.log("Profile picture selected!");
}
};

  const signUp = async () => {
    console.log("Sign Up button pressed");

    // Check that passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const firestore = getFirestore();

      console.log("Creating account...");

      // Create the Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log("Account created successfully!");

      // Get the user's unique Firebase ID
      const uid = userCredential.user.uid;

      console.log("Saving user profile...");

      // Save the user's profile information to Firestore
      await setDoc(doc(firestore, "users", uid), {
        name: name,
        height: height,
        weight: weight,
      });

      console.log("User profile saved successfully!");
      // Save profile picture if the user selected one
if (profilePicture) {
  console.log("Saving profile picture...");

  const manipulatedImage =
    await ImageManipulator.manipulateAsync(
      profilePicture,
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
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

  // Convert the image to Base64
  const base64Image =
    await FileSystem.readAsStringAsync(
      manipulatedImage.uri,
      {
        encoding: FileSystem.EncodingType.Base64,
      }
    );

  // Add the image format
  const imageData =
    `data:image/jpeg;base64,${base64Image}`;

  // Save the picture in its own Firestore document
  await setDoc(
    doc(
      firestore,
      "users",
      uid,
      "private",
      "avatarData"
    ),
    {
      imageData: imageData,
    }
  );

  console.log("Profile picture saved successfully!");
}

      console.log("Sending verification email...");

      // Send verification email
      await sendEmailVerification(userCredential.user);

      console.log("Verification email sent successfully!");

      console.log("Signing user out...");

      // Sign the user out immediately
      await signOut(auth);

      console.log("User signed out successfully!");

      alert(
        "Account created! Please check your email to verify your account."
      );
    } catch (e: any) {
      console.log("Registration failed:", e);
      console.log("Error code:", e.code);
      console.log("Error message:", e.message);

      alert("Registration failed: " + e.message);
    } finally {
      setLoading(false);
      console.log("Registration process finished");
    }
  };

  const signUpWithGoogle = async () => {
    console.log("Google Sign Up button pressed");

    setLoading(true);

    try {
      const auth = getAuth();
      const firestore = getFirestore();

      // Check that Google Play Services is available
      await GoogleSignin.hasPlayServices();

      // Open the Google account selection screen
      const response = await GoogleSignin.signIn();

      // Get the Google ID token
      const idToken = response.data?.idToken;

      if (!idToken) {
        throw new Error("No Google ID token was returned.");
      }

      // Create a Firebase credential using the Google ID token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase
      const userCredential = await signInWithCredential(
        auth,
        googleCredential
      );

      console.log("Google account created/signed in successfully!");

      // Get the user's Firebase information
      const user = userCredential.user;

      // Get the user's unique Firebase ID
      const uid = user.uid;

      // Get the Google display name
      const displayName = user.displayName || "";

      // Get only the first name
      const firstName = displayName.split(" ")[0];

      // Get the Google profile picture
      const profilePictureUrl = user.photoURL || "";

      // Save the user's profile information to Firestore
      await setDoc(doc(firestore, "users", uid), {
        name: firstName,
        height: height,
        weight: weight,
        profilePictureUrl: profilePictureUrl,
      });

      console.log("Google user profile saved successfully!");

      alert("Signed up with Google successfully!");
    } catch (e: any) {
      console.log("Google sign up failed:", e);
      console.log("Error code:", e.code);
      console.log("Error message:", e.message);

      alert("Google sign up failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={Styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <Text style={Styles.title}>Register</Text>
        <Pressable onPress={chooseProfilePicture}>
          <Image
            source={
              profilePicture
                ? { uri: profilePicture }
                : require("../assets/default-profile.png")
            }
            style={Styles.profilePicture}
          />
        </Pressable>

        <Text style={Styles.profilePictureLabel}>
          Profile Picture (Optional)
        </Text>

        <Text style={Styles.profilePictureHint}>
          Tap the image to choose a profile picture
        </Text>

        <Text style={Styles.label}>Name (Optional)</Text>
        <TextInput
          style={Styles.input}
          value={name}
          onChangeText={setName}
        />

        <Text style={Styles.label}>Height (cm) (Optional)</Text>
        <TextInput
          style={Styles.input}
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
        />

        <Text style={Styles.label}>Weight (kg) (Optional)</Text>
        <TextInput
          style={Styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        <Text style={Styles.label}>Email</Text>
        <TextInput
          style={Styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={Styles.label}>Password</Text>
        <TextInput
          style={Styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={Styles.label}>Confirm Password</Text>
        <TextInput
          style={Styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator
            size="small"
            style={{ margin: 28 }}
          />
        ) : null}

        <Button
          title="Sign Up"
          onPress={signUp}
        />

        <Text style={Styles.orText}>OR</Text>

        <Pressable onPress={signUpWithGoogle}>
          <Image
            source={require("../assets/google-signup.png")}
            style={Styles.googleButton}
          />
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const Styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    flex: 1,
    justifyContent: "center",
  },

  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
  },

  label: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: 2,
  },

  input: {
    marginVertical: 3,
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#fff",
  },

  orText: {
    textAlign: "center",
    marginVertical: 10,
  },

  googleButton: {
    width: "100%",
    height: 50,
    resizeMode: "contain",
  },

  profilePicture: {
  width: 100,
  height: 100,
  borderRadius: 50,
  alignSelf: "center",
  marginBottom: 20,
},

profilePictureLabel: {
  fontSize: 15,
  textAlign: "center",
  marginBottom: 2,
},

profilePictureHint: {
  fontSize: 13,
  color: "#666",
  textAlign: "center",
  marginBottom: 10,
},
});