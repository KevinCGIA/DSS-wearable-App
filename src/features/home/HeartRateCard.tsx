import React from 'react';
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { Pill } from '@/components/ui/Pill';
import { Waveform } from '@/components/ui/Waveform';
import type { LatestReadingState } from '@/data/types';
import { formatAge, LIVE_WITHIN_MS, STALE_AFTER_MS } from '@/lib/time';
import { colors, layout, spacing, type } from '@/theme';
import type { RestingRange } from './homeModel';

type Props = {
  heartRate: LatestReadingState;
  restingRange: RestingRange | null;
  now: number;
  onPress: () => void;
};

export function HeartRateCard({ heartRate, restingRange, now, onPress }: Props) {
  // Square: at least as tall as the card is wide, but free to grow at large text sizes.
  const side = useWindowDimensions().width - layout.screenPadding * 2;
  const { reading, loading, error } = heartRate;
  const age = reading ? now - reading.timestamp.getTime() : 0;
  const live = Boolean(reading) && age <= LIVE_WITHIN_MS;
  const stale = Boolean(reading) && age > STALE_AFTER_MS;

  const badge = reading ? (
    live ? (
      <Pill label="Live" tier="live" dot shape="square" />
    ) : (
      <Pill label={`Last seen ${formatAge(age)}`} tier="neutral" shape="square" />
    )
  ) : null;

  const bpm = reading ? String(Math.round(reading.value)) : '--';

  return (
    <Card onPress={onPress} style={{ ...styles.card, minHeight: side }}>
      <CardTitle icon="heart" title="Heart Rate" right={badge} />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      ) : (
        <View
          style={styles.center}
          accessible
          accessibilityLabel={reading ? `Heart rate ${bpm} beats per minute` : 'Heart rate, no reading'}
        >
          <View style={styles.valueRow}>
            <Text style={[type.hero, styles.value, (!reading || stale) && styles.muted]} maxFontSizeMultiplier={1.3}>
              {bpm}
            </Text>
            <Text style={[type.subheading, styles.unit]}>BPM</Text>
          </View>

          {error ? (
            <Text style={[type.body, styles.message, styles.error]}>{error}</Text>
          ) : !reading ? (
            <Text style={[type.body, styles.message]}>
              No readings yet. Connect your wearable to start tracking.
            </Text>
          ) : restingRange ? (
            <Text style={[type.label, styles.message]}>
              Resting: {restingRange.low}–{restingRange.high} bpm ·{' '}
              <Text style={restingRange.status === 'Normal' ? styles.normal : styles.warning}>
                {restingRange.status}
              </Text>
            </Text>
          ) : null}

          {reading ? <Waveform active={live} style={styles.wave} /> : null}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.xl },
  spinner: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  value: { color: colors.text },
  muted: { color: colors.textMuted },
  unit: { color: colors.accent, marginLeft: spacing.sm },
  message: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  error: { color: colors.danger },
  normal: { color: colors.vital.calm },
  warning: { color: colors.vital.peak },
  wave: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
