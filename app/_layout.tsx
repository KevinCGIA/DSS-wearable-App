import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  const router = useRouter();
  const segments = useSegments();

  const handleAuthStateChanged = (user: any) => {
    setUser(user);

    if (initializing) {
      setInitializing(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();

    const subscriber = onAuthStateChanged(
      auth,
      handleAuthStateChanged
    );

    return subscriber;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (user && !inAuthGroup) {
      router.replace('/(auth)/home');
    } else if (!user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

return (
  <Stack>
    <Stack.Screen
      name="index"
      options={{ headerShown: false }}
    />

    <Stack.Screen
      name="login"
      options={{ headerShown: false }}
    />

    <Stack.Screen
      name="register"
      options={{ headerShown: false }}
    />

    <Stack.Screen
      name="(auth)"
      options={{ headerShown: false }}
    />
  </Stack>
);
}
