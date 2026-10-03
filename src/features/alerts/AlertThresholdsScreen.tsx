import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Screen } from '@/components/ui/Screen';
import { Stepper } from '@/components/ui/Stepper';
import { Toggle } from '@/components/ui/Toggle';
import type { AlertThresholds } from '@/data/types';
import { HR_MAX_RANGE, HR_MIN_RANGE } from '@/lib/alerts/thresholds';
import { colors, layout, radius, spacing, type } from '@/theme';

export type AlertThresholdsScreenProps = {
  draft: AlertThresholds;
  loading: boolean;
  loadError: string | null;
  saving: boolean;
  dirty: boolean;
  validationError: string | null;
  notice: { tone: 'success' | 'error'; message: string } | null;
  onSetEnabled: (enabled: boolean) => void;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  onSave: () => void;
  onRetry: () => void;
  onBack: () => void;
};

const STEP = 5;

export function AlertThresholdsScreen({
  draft,
  loading,
  loadError,
  saving,
  dirty,
  validationError,
  notice,
  onSetEnabled,
  onChangeMin,
  onChangeMax,
  onSave,
  onRetry,
  onBack,
}: AlertThresholdsScreenProps) {
  return (
    <Screen
      scroll
      hero={
        <HeroHeader
          title="Alert Thresholds"
          subtitle="Get notified when your heart rate goes outside your range."
          onBack={onBack}
        />
      }
    >
      {loading ? (
        <Card style={styles.first}>
          <ActivityIndicator color={colors.accent} style={styles.spinner} />
        </Card>
      ) : loadError ? (
        <ErrorBanner message={loadError} actionLabel="Retry" onAction={onRetry} style={styles.first} />
      ) : (
        <>
          <Card padding={0} style={styles.first}>
            <Toggle
              label="Heart rate alerts"
              hint="Notify me when my heart rate is too high or too low"
              value={draft.enabled}
              onValueChange={onSetEnabled}
            />
          </Card>

          <Card style={draft.enabled ? styles.card : styles.cardOff}>
            <CardTitle icon="sliders" title="Your range" />
            <RangeBar min={draft.hrMin} max={draft.hrMax} />
            <View style={styles.steppers}>
              <Stepper
                label="Minimum"
                value={draft.hrMin}
                onChange={onChangeMin}
                min={HR_MIN_RANGE.min}
                max={HR_MIN_RANGE.max}
                step={STEP}
                unit="BPM"
                disabled={!draft.enabled}
              />
              <Stepper
                label="Maximum"
                value={draft.hrMax}
                onChange={onChangeMax}
                min={HR_MAX_RANGE.min}
                max={HR_MAX_RANGE.max}
                step={STEP}
                unit="BPM"
                disabled={!draft.enabled}
              />
            </View>
            {validationError ? <ErrorBanner message={validationError} style={styles.banner} /> : null}
          </Card>

          <Card style={styles.card}>
            <View style={styles.infoRow}>
              <Feather name="info" size={16} color={colors.accentText} />
              <Text style={[type.body, styles.info]}>
                {draft.enabled
                  ? `You'll get an alert below ${draft.hrMin} or above ${draft.hrMax} BPM, at most once a minute for each type. Alerts appear in Notifications.`
                  : 'Alerts are off. Turn them on to be notified when your heart rate leaves your range.'}
              </Text>
            </View>
          </Card>

          {notice ? <ErrorBanner message={notice.message} tone={notice.tone} style={styles.banner} /> : null}

          <Button
            label={dirty ? 'Save' : 'Saved'}
            icon={dirty ? undefined : 'check'}
            onPress={onSave}
            loading={saving}
            disabled={!dirty || Boolean(validationError)}
            fullWidth
            style={styles.save}
          />
        </>
      )}
    </Screen>
  );
}

// Full scale 30–220 BPM with the alert-free band highlighted.
function RangeBar({ min, max }: { min: number; max: number }) {
  const low = HR_MIN_RANGE.min;
  const high = HR_MAX_RANGE.max;
  const pct = (v: number) => `${((Math.min(Math.max(v, low), high) - low) / (high - low)) * 100}%` as const;

  return (
    <View
      style={styles.rangeWrap}
      accessible
      accessibilityLabel={`Normal range ${min} to ${max} beats per minute`}
    >
      <View style={styles.track}>
        <View style={[styles.zoneLow, { width: pct(min) }]} />
        <View style={[styles.band, { left: pct(min), right: `${100 - parseFloat(pct(max))}%` }]} />
        <View style={[styles.zoneHigh, { left: pct(max) }]} />
      </View>
      <View style={styles.rangeLabels}>
        <Text style={[type.caption, styles.muted]}>{low}</Text>
        <Text style={[type.label, styles.bandLabel]}>
          {min}–{max} BPM
        </Text>
        <Text style={[type.caption, styles.muted]}>{high}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: spacing.xl },
  card: { marginTop: spacing.lg },
  cardOff: { marginTop: spacing.lg, opacity: 0.55 },
  spinner: { marginVertical: spacing.huge },
  steppers: { marginTop: spacing.md, gap: spacing.sm },
  banner: { marginTop: spacing.lg },
  infoRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  info: { flex: 1, color: colors.textSecondary },
  save: { marginTop: spacing.xl },
  rangeWrap: { marginTop: spacing.lg },
  track: {
    height: layout.progressHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  zoneLow: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.warningSurface },
  zoneHigh: { position: 'absolute', right: 0, top: 0, bottom: 0, backgroundColor: colors.dangerSurface },
  band: { position: 'absolute', top: 0, bottom: 0, backgroundColor: colors.vital.calm },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  bandLabel: { color: colors.good },
  muted: { color: colors.textMuted },
});
