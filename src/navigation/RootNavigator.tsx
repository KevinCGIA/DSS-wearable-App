import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { TabBar, tabBarBaseHeight } from '@/components/ui/TabBar';
import { AlertThresholdsScreen } from '@/features/alerts/AlertThresholdsScreen';
import { DevicesScreen } from '@/features/devices/DevicesScreen';
import { FitnessScreen } from '@/features/fitness/FitnessScreen';
import { HeartRateScreen } from '@/features/heart-rate/HeartRateScreen';
import { HomeContainer } from '@/features/home/HomeContainer';
import { NotificationsScreen } from '@/features/notifications/NotificationsScreen';
import { PreferencesScreen } from '@/features/preferences/PreferencesScreen';
import { PreviewsScreen } from '@/features/previews/PreviewsScreen';
import { previewEntries } from '@/features/previews/registry';
import { SettingsContainer } from '@/features/settings/SettingsContainer';
import { SleepScreen } from '@/features/sleep/SleepScreen';
import { colors } from '@/theme';
import type { Navigation, StackRoute, TabKey } from './routes';

type Props = {
  displayName: string;
  onSignOut: () => void;
};

export function RootNavigator({ displayName, onSignOut }: Props) {
  const [tab, setTab] = useState<TabKey>('home');
  const [stack, setStack] = useState<StackRoute[]>([]);

  const navigation = useMemo<Navigation>(
    () => ({
      openTab: (next) => {
        setStack([]);
        setTab(next);
      },
      push: (route) => setStack((prev) => [...prev, route]),
      back: () => setStack((prev) => prev.slice(0, -1)),
    }),
    [],
  );

  const handleHardwareBack = useCallback(() => {
    if (stack.length > 0) {
      navigation.back();
      return true;
    }
    if (tab !== 'home') {
      setTab('home');
      return true;
    }
    return false;
  }, [stack.length, tab, navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [handleHardwareBack]);

  const top = stack[stack.length - 1];

  return (
    <View style={styles.shell}>
      <View style={styles.fill} importantForAccessibility={top ? 'no-hide-descendants' : 'auto'}>
        {tab === 'home' ? (
          <HomeContainer
            displayName={displayName}
            bottomInset={tabBarBaseHeight}
            onOpenSettings={() => navigation.openTab('settings')}
            onOpenDevices={() => navigation.push('devices')}
            onOpenTab={navigation.openTab}
          />
        ) : null}
        {tab === 'heart-rate' ? <HeartRateScreen bottomInset={tabBarBaseHeight} /> : null}
        {tab === 'fitness' ? <FitnessScreen bottomInset={tabBarBaseHeight} /> : null}
        {tab === 'sleep' ? <SleepScreen bottomInset={tabBarBaseHeight} /> : null}
        {tab === 'settings' ? (
          <SettingsContainer
            bottomInset={tabBarBaseHeight}
            signOut={onSignOut}
            onOpenDevices={() => navigation.push('devices')}
            onOpenAlertThresholds={() => navigation.push('alert-thresholds')}
            onOpenNotifications={() => navigation.push('notifications')}
            onOpenPreferences={() => navigation.push('preferences')}
            onOpenPreviews={__DEV__ ? () => navigation.push('previews') : undefined}
          />
        ) : null}
        <TabBar active={tab} onChange={navigation.openTab} />
      </View>

      {top ? (
        <View style={styles.overlay} accessibilityViewIsModal>
          {renderStackRoute(top, navigation)}
        </View>
      ) : null}
    </View>
  );
}

function renderStackRoute(route: StackRoute, navigation: Navigation) {
  switch (route) {
    case 'devices':
      return <DevicesScreen onBack={navigation.back} />;
    case 'alert-thresholds':
      return <AlertThresholdsScreen onBack={navigation.back} />;
    case 'notifications':
      return <NotificationsScreen onBack={navigation.back} />;
    case 'preferences':
      return <PreferencesScreen onBack={navigation.back} />;
    case 'previews':
      return __DEV__ ? <PreviewsScreen entries={previewEntries} onBack={navigation.back} /> : null;
  }
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.bg },
});
