import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import type {
  DailyActivityExtras,
  HistoryState,
  LatestReadingState,
  SleepSummary,
  UserProfile,
} from '@/data/types';
import { formatShortDate, greetingFor } from '@/lib/time';
import type { Units } from '@/lib/measures';
import { colors, spacing, type } from '@/theme';
import type { DashboardDevice, RestingRange } from './dashboardModel';
import { DeviceFilterBar } from './DeviceFilterBar';
import { DevicesStrip } from './DevicesStrip';
import { HeartRateCard } from './HeartRateCard';
import { HelpSheet } from './HelpSheet';
import { MetricsCard } from './MetricsCard';
import { SleepRecoveryCard } from './SleepRecoveryCard';
import { StepsCard } from './StepsCard';

export type DashboardScreenProps = {
  now: number;
  profile: UserProfile | null;
  profileLoading: boolean;
  devices: DashboardDevice[];
  filterDeviceId: string | null;
  heartRate: LatestReadingState;
  heartRateHistory: HistoryState;
  restingRange: RestingRange | null;
  steps: LatestReadingState;
  stepsHistory: HistoryState;
  sleep: SleepSummary | null;
  activity: DailyActivityExtras;
  units: Units;
  bottomInset: number;
  onChangeFilter: (deviceId: string | null) => void;
  onOpenProfile: () => void;
  onOpenDevices: (deviceId?: string) => void;
  onOpenHeartRate: () => void;
  onOpenSteps: () => void;
  onOpenSleep: () => void;
};

// Combines Android's Home, Heart Rate, Fitness and Sleep tabs (iOS researcher layout, 2026-10-04).
export function DashboardScreen({
  now,
  profile,
  profileLoading,
  devices,
  filterDeviceId,
  heartRate,
  heartRateHistory,
  restingRange,
  steps,
  stepsHistory,
  sleep,
  activity,
  units,
  bottomInset,
  onChangeFilter,
  onOpenProfile,
  onOpenDevices,
  onOpenHeartRate,
  onOpenSteps,
  onOpenSleep,
}: DashboardScreenProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  const firstName = profile?.name.trim().split(/s+/)[0] ?? '';
  const connected = devices.some((d) => d.status === 'connected');

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
      <DevicesStrip devices={devices} onOpenDevices={onOpenDevices} />
      <DeviceFilterBar devices={devices} deviceId={filterDeviceId} onChange={onChangeFilter} />

      <HeartRateCard
        heartRate={heartRate}
        history={heartRateHistory}
        restingRange={restingRange}
        now={now}
        onPress={onOpenHeartRate}
      />
      <StepsCard steps={steps} history={stepsHistory} now={now} onPress={onOpenSteps} />
      <SleepRecoveryCard sleep={sleep} onPress={onOpenSleep} />
      <MetricsCard activity={activity} units={units} />

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
