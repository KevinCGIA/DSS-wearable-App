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
import { formatShortDate, greetingFor } from '@/lib/time';
import type { Units } from '@/lib/measures';
import { colors, spacing, type } from '@/theme';
import { ActiveCaloriesCard } from './ActiveCaloriesCard';
import { DeviceActivityCard } from './DeviceActivityCard';
import { HeartRateCard } from './HeartRateCard';
import { HelpSheet } from './HelpSheet';
import { deviceViewFrom, stepsTodayFrom } from './dashboardModel';
import type { RestingRange } from './dashboardModel';
import { SleepRecoveryCard } from './SleepRecoveryCard';

export type DashboardScreenProps = {
  now: number;
  profile: UserProfile | null;
  profileLoading: boolean;
  connection: ConnectionState;
  refreshing: boolean;
  heartRate: LatestReadingState;
  restingRange: RestingRange | null;
  steps: LatestReadingState;
  activity: DailyActivityExtras;
  units: Units;
  sleep: SleepSummary | null;
  bottomInset: number;
  onRefresh: () => void;
  onOpenProfile: () => void;
  onOpenDevices: () => void;
  onOpenHeartRate: () => void;
  onOpenSteps: () => void;
  onOpenSleep: () => void;
};

// The old Home layout (approved in Phase 1); cards open the Heart Rate, Steps and Sleep detail pages.
export function DashboardScreen({
  now,
  profile,
  profileLoading,
  connection,
  refreshing,
  heartRate,
  restingRange,
  steps,
  activity,
  units,
  sleep,
  bottomInset,
  onRefresh,
  onOpenProfile,
  onOpenDevices,
  onOpenHeartRate,
  onOpenSteps,
  onOpenSleep,
}: DashboardScreenProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  const firstName = profile?.name.trim().split(/\s+/)[0] ?? '';
  const connected = connection.status === 'connected';

  return (
    <Screen
      scroll
      bottomInset={bottomInset}
      heroOverlap
      hero={
        <>
          <View style={styles.topBar}>
            <Text style={[type.label, styles.date]} numberOfLines={1}>
              <Text style={styles.greeting}>{greetingFor(new Date(now))}</Text>
              {' · '}
              {formatShortDate(new Date(now))}
            </Text>
            <View style={styles.topActions}>
              <IconButton glyph="?" variant="onAccent" accessibilityLabel="Help" onPress={() => setHelpOpen(true)} />
              <Avatar
                uri={profile?.avatarData ?? null}
                name={profile?.name}
                loading={profileLoading}
                statusDot={connected}
                onPress={onOpenProfile}
                accessibilityLabel={connected ? 'Open profile. Device connected' : 'Open profile'}
              />
            </View>
          </View>

          <Text style={[type.title, styles.title]} accessibilityRole="header">
            {firstName ? `Welcome, ${firstName}!` : 'Welcome!'}
          </Text>
          <Text style={[type.body, styles.subtitle]}>Here is your daily summary</Text>
        </>
      }
    >
      <HeartRateCard
        heartRate={heartRate}
        restingRange={restingRange}
        now={now}
        onPress={onOpenHeartRate}
      />

      <DeviceActivityCard
        device={deviceViewFrom(connection, refreshing)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        stepsToday={stepsTodayFrom(steps.reading, now)}
        activity={activity}
        units={units}
        onOpenDevices={onOpenDevices}
        onOpenSteps={onOpenSteps}
      />

      <SleepRecoveryCard sleep={sleep} onPress={onOpenSleep} />

      <ActiveCaloriesCard activity={activity} onPress={onOpenSteps} />

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
  date: { flex: 1, color: colors.textOnAccentMuted, marginRight: spacing.md },
  greeting: { color: colors.textOnAccent },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { color: colors.textOnAccent, marginTop: spacing.xl },
  subtitle: { color: colors.textOnAccentMuted, marginTop: spacing.xs },
});
