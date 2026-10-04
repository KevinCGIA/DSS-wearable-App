import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { TabBar, tabBarBaseHeight } from '@/components/ui/TabBar';
import { AlertThresholdsContainer } from '@/features/alerts/AlertThresholdsContainer';
import { DashboardContainer } from '@/features/dashboard/DashboardContainer';
import { DeviceFilterProvider } from '@/features/dashboard/DeviceFilterProvider';
import { BleProvider } from '@/features/devices/BleProvider';
import { DevicesContainer } from '@/features/devices/DevicesContainer';
import { HeartRateContainer } from '@/features/heart-rate/HeartRateContainer';
import { NotificationsContainer } from '@/features/notifications/NotificationsContainer';
import { PreferencesContainer } from '@/features/preferences/PreferencesContainer';
import { usePreferences } from '@/features/preferences/PreferencesProvider';
import { PreviewsScreen } from '@/features/previews/PreviewsScreen';
import { previewEntries } from '@/features/previews/registry';
import { ProfileContainer } from '@/features/profile/ProfileContainer';
import { ProfileProvider } from '@/features/profile/ProfileProvider';
import { SettingsContainer } from '@/features/settings/SettingsContainer';
import { SleepContainer } from '@/features/sleep/SleepContainer';
import { StepsContainer } from '@/features/steps/StepsContainer';
import { colors } from '@/theme';
import { DEFAULT_TAB } from './routes';
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
  // Subscribing re-renders the whole tree when text size changes (see applyTextScale).
  usePreferences();
  const [tab, setTab] = useState<TabKey>(DEFAULT_TAB);
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
    if (tabRef.current !== DEFAULT_TAB) {
      navigation.openTab(DEFAULT_TAB);
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
      <ProfileProvider displayName={displayName}>
        <DeviceFilterProvider>
          <View style={styles.shell}>
            <View style={styles.fill} importantForAccessibility={top ? 'no-hide-descendants' : 'auto'}>
              <GuardScope scope={tabScope(tab)} registry={registry}>
                {tab === 'devices' ? <DevicesContainer bottomInset={tabBarBaseHeight} /> : null}
                {tab === 'dashboard' ? (
                  <DashboardContainer
                    displayName={displayName}
                    bottomInset={tabBarBaseHeight}
                    onOpenProfile={() => navigation.push('profile')}
                    // Part 2: scroll to that device's card in the Devices tab.
                    onOpenDevices={() => navigation.openTab('devices')}
                    onOpenHeartRate={() => navigation.push('heart-rate')}
                    onOpenSteps={() => navigation.push('steps')}
                    onOpenSleep={() => navigation.push('sleep')}
                  />
                ) : null}
                {tab === 'settings' ? (
                  <SettingsContainer
                    bottomInset={tabBarBaseHeight}
                    signOut={onSignOut}
                    onOpenProfile={() => navigation.push('profile')}
                    onOpenDevices={() => navigation.openTab('devices')}
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
        </DeviceFilterProvider>
      </ProfileProvider>
    </BleProvider>
  );
}

function renderStackRoute(route: StackRoute, navigation: Navigation) {
  switch (route) {
    case 'profile':
      return <ProfileContainer onBack={navigation.back} />;
    case 'heart-rate':
      return (
        <HeartRateContainer
          onBack={navigation.back}
          onOpenAlertThresholds={() => navigation.push('alert-thresholds')}
        />
      );
    case 'steps':
      return <StepsContainer onBack={navigation.back} />;
    case 'sleep':
      return <SleepContainer onBack={navigation.back} />;
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
      return <PreferencesContainer onBack={navigation.back} />;
    case 'previews':
      return __DEV__ ? <PreviewsScreen entries={previewEntries} onBack={navigation.back} /> : null;
  }
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.bg },
});
