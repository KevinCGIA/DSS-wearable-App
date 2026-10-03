import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { StageTrack } from '@/components/ui/StageTrack';
import { StatReadout } from '@/components/ui/StatReadout';
import { colors, radius, spacing, type, elevation } from '@/theme';
import { lastNight, sleepStages, weeklySleepScore } from '@/data/sleep';

export type AreaKey = 'devices' | 'monitoring' | 'analytics' | 'account';

type Props = {
  displayName: string;
  bottomInset: number;
  onOpenArea: (area: AreaKey) => void;
};

const areas: { key: AreaKey; label: string; hint: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'devices', label: 'Devices', hint: 'Pair & manage', icon: 'bluetooth' },
  { key: 'monitoring', label: 'Live monitor', hint: 'Real-time vitals', icon: 'activity' },
  { key: 'analytics', label: 'Analytics', hint: 'Trends & zones', icon: 'bar-chart-2' },
  { key: 'account', label: 'Account', hint: 'Profile & goals', icon: 'user' },
];

const trend = [58, 64, 71, 69, 78, 84, 91, 87, 95, 102, 98, 94, 89, 96, 104];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen({ displayName, bottomInset, onOpenArea }: Props) {
  const [bpm, setBpm] = useState(96);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setBpm((prev) => {
        const drift = Math.round((Math.random() - 0.5) * 6);
        return Math.min(148, Math.max(62, prev + drift));
      });
    }, 2000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const zone = useMemo(() => {
    if (bpm < 90) return 'Resting zone';
    if (bpm < 120) return 'Fat burn zone';
    return 'Cardio zone';
  }, [bpm]);

  const peak = Math.max(...trend);

  return (
    <Screen scroll bottomInset={bottomInset}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[type.body, styles.greeting]}>{greeting()}</Text>
          <Text style={[type.title, styles.name]}>{displayName}</Text>
        </View>
        <Pressable style={styles.avatar}>
          <Feather name="bell" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Pill label="Band 2 connected" tier="live" dot icon="bluetooth" style={styles.devicePill} />

      <LinearGradient
        colors={[...colors.accentGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={[type.label, styles.liveTagText]}>Live</Text>
          </View>
          <Text style={[type.label, styles.heroZone]}>{zone}</Text>
        </View>

        <StatReadout
          value={bpm}
          unit="bpm"
          label="Heart rate"
          icon="heart"
          size="hero"
          tone="onAccent"
          style={styles.heroStat}
        />

        <View style={styles.spark}>
          {trend.map((point, index) => (
            <View
              key={index}
              style={[
                styles.sparkBar,
                {
                  height: 8 + (point / peak) * 36,
                  opacity: index === trend.length - 1 ? 1 : 0.45,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[type.caption, styles.sparkLabel]}>Last 15 minutes</Text>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Text style={[type.heading, styles.sectionTitle]}>This session</Text>
        <Pill label="42 min" tier="session" icon="clock" />
      </View>

      <View style={styles.statRow}>
        <Card style={styles.statCard} padding={spacing.lg}>
          <StatReadout value={lastNight.totalLabel} label="Sleep" icon="moon" size="large" />
        </Card>
        <Card style={styles.statCard} padding={spacing.lg}>
          <StatReadout value="4,912" label="Steps" icon="trending-up" size="large" />
        </Card>
      </View>

      <View style={styles.statRow}>
        <Card style={styles.statCard} padding={spacing.lg}>
          <StatReadout value="88" unit="bpm" label="Average" icon="heart" size="large" />
        </Card>
        <Card style={styles.statCard} padding={spacing.lg}>
          <StatReadout value="127" unit="bpm" label="Peak" icon="chevrons-up" size="large" />
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[type.heading, styles.sectionTitle]}>Last night</Text>
        <Pill label={`Score ${lastNight.score} · ${lastNight.rating}`} tier="session" icon="moon" />
      </View>

      <Card style={styles.sleepCard}>
        <View style={styles.sleepHead}>
          <StatReadout value={lastNight.totalLabel} label="Time asleep" size="large" />
          <Text style={[type.caption, styles.sleepWindow]}>
            {lastNight.start} — {lastNight.end}
          </Text>
        </View>

        <View style={styles.stages}>
          {sleepStages.map((stage) => (
            <StageTrack
              key={stage.key}
              label={stage.label}
              duration={stage.duration}
              color={stage.color}
              segments={stage.segments}
            />
          ))}
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={[type.heading, styles.sectionTitle]}>Sleep score</Text>
        <Pill label="This week" tier="neutral" />
      </View>

      <Card style={styles.chartCard}>
        <BarChart data={weeklySleepScore} highlightLast />
      </Card>

      <Text style={[type.heading, styles.exploreTitle]}>Explore</Text>

      <View style={styles.grid}>
        {areas.map((area) => (
          <Card
            key={area.key}
            style={styles.tile}
            padding={spacing.lg}
            onPress={() => onOpenArea(area.key)}
          >
            <View style={styles.tileIcon}>
              <Feather name={area.icon} size={18} color={colors.accentText} />
            </View>
            <Text style={[type.subheading, styles.tileLabel]}>{area.label}</Text>
            <Text style={[type.caption, styles.tileHint]}>{area.hint}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  headerText: { flex: 1 },
  greeting: { color: colors.textMuted },
  name: { color: colors.text, marginTop: spacing.xs },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devicePill: { marginTop: spacing.lg },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.lg,
    ...elevation.hero,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.textOnAccent,
    marginRight: spacing.sm,
  },
  liveTagText: { color: colors.textOnAccent },
  heroZone: { color: 'rgba(255,255,255,0.82)' },
  heroStat: { marginTop: spacing.xl },
  spark: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 46,
    marginTop: spacing.xl,
  },
  sparkBar: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.textOnAccent,
  },
  sparkLabel: { color: 'rgba(255,255,255,0.75)', marginTop: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxxl,
  },
  sectionTitle: { color: colors.text },
  statRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statCard: { flex: 1 },
  sleepCard: { marginTop: spacing.lg },
  sleepHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  sleepWindow: { color: colors.textMuted },
  stages: { gap: spacing.lg },
  chartCard: { marginTop: spacing.lg },
  exploreTitle: { color: colors.text, marginTop: spacing.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  tile: { width: '48%', flexGrow: 1 },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tileLabel: { color: colors.text },
  tileHint: { color: colors.textMuted, marginTop: 2 },
});
