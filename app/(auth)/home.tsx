import { getAuth, signOut } from '@react-native-firebase/auth';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function Home() {

  const logout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (e: any) {
      alert('Logout failed: ' + e.message);
    }
  };

  return (
    <View style={Styles.container}>
      <Text>Welcome!</Text>

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
    paddingTop: 50,
    paddingHorizontal: 20,
  },

  logoutButton: {
    marginTop: 30,
  },
});