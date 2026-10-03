import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { TabBar, tabBarBaseHeight } from '@/components/ui/TabBar';
import { AlertThresholdsContainer } from '@/features/alerts/AlertThresholdsContainer';
import { BleProvider } from '@/features/devices/BleProvider';
import { DevicesContainer } from '@/features/devices/DevicesContainer';
import { FitnessContainer } from '@/features/fitness/FitnessContainer';
import { HeartRateContainer } from '@/features/heart-rate/HeartRateContainer';
import { HomeContainer } from '@/features/home/HomeContainer';
import { NotificationsContainer } from '@/features/notifications/NotificationsContainer';
import { PreferencesScreen } from '@/features/preferences/PreferencesScreen';
import { PreviewsScreen } from '@/features/previews/PreviewsScreen';
import { previewEntries } from '@/features/previews/registry';
import { SettingsContainer } from '@/features/settings/SettingsContainer';
import { SleepContainer } from '@/features/sleep/SleepContainer';
import { colors } from '@/theme';
import type { Navigation, StackRoute, TabKey } from './routes';
import { confirmLeave, GuardScope } from './unsavedChanges';
import type { GuardRegistry } from './unsavedChanges';

const tabScope = (tab: TabKey) => `tab:${tab}`;
const stackScope = (index: number, route: StackRoute) => `stack:${index}:${route}`;

type Props = {
  displayName: string;
  onSignOut: () => void;
};

export function RootNavigator({ displayName, onSignOut }: Props) {
  const [tab, setTab] = useState<TabKey>('home');
  const [stack, setStack] = useState<StackRoute[]>([]);

  const registry = useRef<GuardRegistry>(new Map()).current;
  const tabRef = useRef(tab);
  const stackRef = useRef(stack);
  tabRef.current = tab;
  stackRef.current = stack;

  // Every way of leaving a screen goes through confirmLeave, so unsaved edits ask "Discard changes?".
  const navigation = useMemo<Navigation>(
    () => ({
      openTab: (next) => {
        const scopes = stackRef.current.map((route, i) => stackScope(i, route));
        if (next !== tabRef.current) scopes.push(tabScope(tabRef.current));
        confirmLeave(registry, scopes, () => {
          setStack([]);
          setTab(next);
        });
      },
      push: (route) => setStack((prev) => [...prev, route]),
      back: () => {
        const current = stackRef.current;
        if (current.length === 0) return;
        const i = current.length - 1;
        confirmLeave(registry, [stackScope(i, current[i])], () => setStack((prev) => prev.slice(0, -1)));
      },
    }),
    [registry],
  );

  const handleHardwareBack = useCallback(() => {
    if (stackRef.current.length > 0) {
      navigation.back();
      return true;
    }
    if (tabRef.current !== 'home') {
      navigation.openTab('home');
      return true;
    }
    return false;
  }, [navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [handleHardwareBack]);

  const top = stack[stack.length - 1];

  return (
    <BleProvider>
      <View style={styles.shell}>
        <View style={styles.fill} importantForAccessibility={top ? 'no-hide-descendants' : 'auto'}>
          <GuardScope scope={tabScope(tab)} registry={registry}>
            {tab === 'home' ? (
              <HomeContainer
                displayName={displayName}
                bottomInset={tabBarBaseHeight}
                onOpenSettings={() => navigation.openTab('settings')}
                onOpenDevices={() => navigation.push('devices')}
                onOpenTab={navigation.openTab}
              />
            ) : null}
            {tab === 'heart-rate' ? (
              <HeartRateContainer
                bottomInset={tabBarBaseHeight}
                onOpenAlertThresholds={() => navigation.push('alert-thresholds')}
              />
            ) : null}
            {tab === 'fitness' ? <FitnessContainer bottomInset={tabBarBaseHeight} /> : null}
            {tab === 'sleep' ? <SleepContainer bottomInset={tabBarBaseHeight} /> : null}
            {tab === 'settings' ? (
              <SettingsContainer
                bottomInset={tabBarBaseHeight}
                displayName={displayName}
                signOut={onSignOut}
                onOpenDevices={() => navigation.push('devices')}
                onOpenAlertThresholds={() => navigation.push('alert-thresholds')}
                onOpenNotifications={() => navigation.push('notifications')}
                onOpenPreferences={() => navigation.push('preferences')}
                onOpenPreviews={__DEV__ ? () => navigation.push('previews') : undefined}
              />
            ) : null}
          </GuardScope>
          <TabBar active={tab} onChange={navigation.openTab} />
        </View>

        {top ? (
          <View style={styles.overlay} accessibilityViewIsModal>
            <GuardScope key={stack.length} scope={stackScope(stack.length - 1, top)} registry={registry}>
              {renderStackRoute(top, navigation)}
            </GuardScope>
          </View>
        ) : null}
      </View>
    </BleProvider>
  );
}

function renderStackRoute(route: StackRoute, navigation: Navigation) {
  switch (route) {
    case 'devices':
      return <DevicesContainer onBack={navigation.back} />;
    case 'alert-thresholds':
      return <AlertThresholdsContainer onBack={navigation.back} />;
    case 'notifications':
      return (
        <NotificationsContainer
          onBack={navigation.back}
          onOpenAlertThresholds={() => navigation.push('alert-thresholds')}
        />
      );
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
