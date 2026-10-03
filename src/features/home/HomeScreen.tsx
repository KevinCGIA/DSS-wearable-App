import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import type {
  ConnectionState,
  DailyActivityExtras,
  LatestReadingState,
  SleepSummary,
  UserProfile,
} from '@/data/types';
import { formatShortDate } from '@/lib/time';
import type { TabKey } from '@/navigation/routes';
import { colors, spacing, type } from '@/theme';
import { ActiveCaloriesCard } from './ActiveCaloriesCard';
import { DeviceActivityCard } from './DeviceActivityCard';
import { HeartRateCard } from './HeartRateCard';
import { HelpSheet } from './HelpSheet';
import { deviceViewFrom, stepsTodayFrom } from './homeModel';
import type { RestingRange } from './homeModel';
import { SleepRecoveryCard } from './SleepRecoveryCard';

export type HomeScreenProps = {
  now: number;
  profile: UserProfile | null;
  profileLoading: boolean;
  connection: ConnectionState;
  refreshing: boolean;
  heartRate: LatestReadingState;
  restingRange: RestingRange | null;
  steps: LatestReadingState;
  activity: DailyActivityExtras;
  sleep: SleepSummary | null;
  bottomInset: number;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenDevices: () => void;
  onOpenTab: (tab: TabKey) => void;
};

export function HomeScreen({
  now,
  profile,
  profileLoading,
  connection,
  refreshing,
  heartRate,
  restingRange,
  steps,
  activity,
  sleep,
  bottomInset,
  onRefresh,
  onOpenSettings,
  onOpenDevices,
  onOpenTab,
}: HomeScreenProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  const firstName = profile?.name.trim().split(/\s+/)[0] ?? '';
  const connected = connection.status === 'connected';

  return (
    <Screen scroll bottomInset={bottomInset}>
      <View style={styles.topBar}>
        <Text style={[type.label, styles.date]}>{formatShortDate(new Date(now))}</Text>
        <View style={styles.topActions}>
          <IconButton
            icon="refresh-cw"
            accessibilityLabel={refreshing ? 'Refreshing device' : 'Refresh device'}
            spinning={refreshing}
            onPress={onRefresh}
          />
          <Avatar
            uri={profile?.avatarData ?? null}
            name={profile?.name}
            loading={profileLoading}
            statusDot={connected}
            onPress={onOpenSettings}
            accessibilityLabel={connected ? 'Open settings. Device connected' : 'Open settings'}
          />
        </View>
      </View>

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[type.title, styles.title]} accessibilityRole="header">
            {firstName ? `Welcome, ${firstName}!` : 'Welcome!'}
          </Text>
          <Text style={[type.body, styles.subtitle]}>Here is your daily summary</Text>
        </View>
        <IconButton glyph="?" variant="outlined" accessibilityLabel="Help" onPress={() => setHelpOpen(true)} />
      </View>

      <HeartRateCard
        heartRate={heartRate}
        restingRange={restingRange}
        now={now}
        onPress={() => onOpenTab('heart-rate')}
      />

      <DeviceActivityCard
        device={deviceViewFrom(connection, refreshing)}
        stepsToday={stepsTodayFrom(steps.reading, now)}
        activity={activity}
        onOpenDevices={onOpenDevices}
        onOpenFitness={() => onOpenTab('fitness')}
      />

      <SleepRecoveryCard sleep={sleep} onPress={() => onOpenTab('sleep')} />

      <ActiveCaloriesCard activity={activity} onPress={() => onOpenTab('fitness')} />

      <HelpSheet visible={helpOpen} onClose={() => setHelpOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  date: { color: colors.textMuted },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  headerText: { flex: 1, marginRight: spacing.md },
  title: { color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: spacing.xs },
});
