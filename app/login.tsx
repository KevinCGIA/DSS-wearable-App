import { useState } from "react";
import {
    ActivityIndicator,
    Button,
    Image,
    KeyboardAvoidingView,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
} from "@react-native-firebase/auth";

import { GoogleSignin } from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId:
    "944450266341-4b3vg7vjptiv7c3sclicu54vhmd6oakr.apps.googleusercontent.com",
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    console.log("Sign In button pressed");

    setLoading(true);

    try {
      const auth = getAuth();

      console.log("Attempting sign in...");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Check if the user's email has been verified
      if (!userCredential.user.emailVerified) {
        await signOut(auth);

        alert("Please verify your email before signing in.");
        return;
      }

      console.log("Sign in successful!");
      alert("Signed in successfully!");
    } catch (e: any) {
      console.log("Sign in failed:", e);
      console.log("Error code:", e.code);
      console.log("Error message:", e.message);

      alert("Sign in failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
  console.log("Google Sign In button pressed");

  setLoading(true);

  try {
    const auth = getAuth();

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
    await signInWithCredential(auth, googleCredential);

    console.log("Google sign in successful!");
    alert("Signed in successfully!");
  } catch (e: any) {
    console.log("Google sign in failed:", e);
    console.log("Error code:", e.code);
    console.log("Error message:", e.message);

    alert("Google sign in failed: " + e.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={Styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <TextInput
          style={Styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={Styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator
            size="small"
            style={{ margin: 28 }}
          />
        ) : null}

        <Button
          title="Sign In"
          onPress={signIn}
        />

        <Pressable onPress={signInWithGoogle}>
        <Image
        source={require("../assets/google-signin.png")}
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

  googleButton: {
  width: "100%",
  height: 50,
  resizeMode: "contain",
  marginTop: 10,
},

  input: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#fff",
  },
});
