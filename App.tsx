import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthContainer } from '@/features/auth/AuthContainer';
import { PreferencesProvider } from '@/features/preferences/PreferencesProvider';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useAppFonts } from '@/lib/useAppFonts';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const fontsLoaded = useAppFonts();
  const session = useAuthSession();
  const ready = fontsLoaded && session.ready;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        {session.signedIn ? (
          <RootNavigator displayName={session.displayName} onSignOut={session.signOut} />
        ) : (
          <AuthContainer onPreview={session.enablePreview} />
        )}
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
