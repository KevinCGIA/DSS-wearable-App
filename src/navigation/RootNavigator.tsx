import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TabBar, tabBarBaseHeight } from '@/components/ui/TabBar';
import type { TabKey } from '@/components/ui/TabBar';
import { AnalyticsScreen } from '@/features/analytics/AnalyticsScreen';
import { HomeScreen } from '@/features/home/HomeScreen';
import type { AreaKey } from '@/features/home/HomeScreen';
import { MonitoringScreen } from '@/features/monitoring/MonitoringScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { colors } from '@/theme';

const areaToTab: Record<AreaKey, TabKey> = {
  devices: 'settings',
  monitoring: 'activity',
  analytics: 'history',
  account: 'settings',
};

type Props = {
  displayName: string;
  onSignOut: () => void;
};

export function RootNavigator({ displayName, onSignOut }: Props) {
  const [tab, setTab] = useState<TabKey>('home');

  return (
    <View style={styles.shell}>
      {tab === 'home' ? (
        <HomeScreen
          displayName={displayName}
          bottomInset={tabBarBaseHeight}
          onOpenArea={(area) => setTab(areaToTab[area])}
        />
      ) : null}
      {tab === 'activity' ? <MonitoringScreen bottomInset={tabBarBaseHeight} /> : null}
      {tab === 'history' ? <AnalyticsScreen bottomInset={tabBarBaseHeight} /> : null}
      {tab === 'settings' ? (
        <SettingsScreen bottomInset={tabBarBaseHeight} onSignOut={onSignOut} />
      ) : null}
      <TabBar active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
});
