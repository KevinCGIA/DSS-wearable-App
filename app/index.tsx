import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();

  return (
    <View style={Styles.container}>
      <Text style={Styles.title}>Welcome to DSS Wearable</Text>

      <Button
        title="Log In"
        onPress={() => router.push("/login")}
      />

      <Button
        title="Register"
        onPress={() => router.push("/register")}
      />
    </View>
  );
}

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 20,
    gap: 10,
  },

  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
  },
});
