import { StyleSheet, Text, View } from "react-native";

export default function Settings() {
  return (
    <View style={Styles.container}>
      <Text style={Styles.title}>Settings</Text>
    </View>
  );
}

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
  },
});