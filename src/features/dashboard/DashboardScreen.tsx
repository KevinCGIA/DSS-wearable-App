import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import type {
  ConnectionState,
  DailyActivityExtras,
  HistoryState,
  LatestReadingState,
  SleepSummary,
  SleepTrends,
  UserProfile,
} from '@/data/types';
import { formatShortDate, greetingFor } from '@/lib/time';
import type { Units } from '@/lib/measures';
import { colors, spacing, type } from '@/theme';
import { ActiveCaloriesCard } from './ActiveCaloriesCard';
import { DeviceActivityCard } from './DeviceActivityCard';
import { HeartRateCard } from './HeartRateCard';
import { HelpSheet } from './HelpSheet';
import { ringViewFrom, stepsTodayFrom } from './dashboardModel';
import type { DeviceSummary, RestingRange } from './dashboardModel';
import { SleepRecoveryCard } from './SleepRecoveryCard';

export type DashboardScreenProps = {
  now: number;
  profile: UserProfile | null;
  profileLoading: boolean;
  connection: ConnectionState;
  // Every connected (or connecting) device; one entry per device.
  devices: DeviceSummary[];
  refreshing: boolean;
  heartRate: LatestReadingState;
  heartRateHistory: HistoryState;
  restingRange: RestingRange | null;
  steps: LatestReadingState;
  stepsHistory: HistoryState;
  activity: DailyActivityExtras;
  units: Units;
  sleep: SleepSummary | null;
  sleepTrends: SleepTrends | null;
  bottomInset: number;
  // Previews: open every card.
  initiallyExpanded?: boolean;
  onRefresh: () => void;
  onOpenProfile: () => void;
  onOpenDevices: () => void;
  onOpenHeartRate: () => void;
  onOpenSteps: () => void;
  onOpenSleep: () => void;
};

// The old Home layout (approved). Cards expand in place; "Open in Activity" links open that Activity section.
export function DashboardScreen({
  now,
  profile,
  profileLoading,
  connection,
  devices,
  refreshing,
  heartRate,
  heartRateHistory,
  restingRange,
  steps,
  stepsHistory,
  activity,
  units,
  sleep,
  sleepTrends,
  bottomInset,
  initiallyExpanded,
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
        history={heartRateHistory}
        restingRange={restingRange}
        now={now}
        initiallyExpanded={initiallyExpanded}
        onOpen={onOpenHeartRate}
      />

      <DeviceActivityCard
        device={ringViewFrom(devices, connection, refreshing)}
        devices={devices}
        stepsHistory={stepsHistory}
        stepsUpdatedAt={steps.reading ? steps.reading.timestamp.getTime() : null}
        now={now}
        initiallyExpanded={initiallyExpanded}
        refreshing={refreshing}
        onRefresh={onRefresh}
        stepsToday={stepsTodayFrom(steps.reading, now)}
        activity={activity}
        units={units}
        onOpenDevices={onOpenDevices}
        onOpenSteps={onOpenSteps}
      />

      <SleepRecoveryCard sleep={sleep} trends={sleepTrends} initiallyExpanded={initiallyExpanded} onOpen={onOpenSleep} />

      <ActiveCaloriesCard activity={activity} initiallyExpanded={initiallyExpanded} onOpen={onOpenSteps} />

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
