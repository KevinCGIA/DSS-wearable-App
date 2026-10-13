import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CardLink } from '@/components/ui/CardLink';
import { CardTitle } from '@/components/ui/CardTitle';
import { ExpandableCard } from '@/components/ui/ExpandableCard';
import { ExpandChevron } from '@/components/ui/ExpandChevron';
import type { VitalView } from '@/features/activity/vitalsModel';
import { formatMetric } from '@/lib/biometrics/metrics';
import type { Units } from '@/lib/measures';
import { formatAge } from '@/lib/time';
import { colors, layout, spacing, type } from '@/theme';

type Props = {
  now: number;
  // latest value per vital (energy and distance are on their own cards)
  vitals: VitalView[];
  units: Units;
  initiallyExpanded?: boolean;
  onOpen: () => void;
};

const COLLAPSED = 4;

function shown(vital: VitalView, units: Units) {
  const main = formatMetric(vital.type, vital.latest.value, units);
  if (vital.latest.secondary === null) return main;
  return { value: `${main.value}/${formatMetric(vital.type, vital.latest.secondary, units).value}`, unit: main.unit };
}

export function VitalsCard({ now, vitals, units, initiallyExpanded, onOpen }: Props) {
  const label = vitals
    .map((v) => {
      const value = shown(v, units);
      return `${v.metric.shortLabel} ${value.value} ${value.unit}`;
    })
    .join(', ');

  return (
    <ExpandableCard
      style={styles.card}
      initiallyExpanded={initiallyExpanded}
      accessibilityLabel={`Vitals: ${label}`}
      header={({ expanded }) => (
        <>
          <CardTitle icon="thermometer" title="Vitals" right={<ExpandChevron expanded={expanded} />} />
          <Grid now={now} vitals={expanded ? vitals : vitals.slice(0, COLLAPSED)} units={units} withAge={expanded} />
          {!expanded && vitals.length > COLLAPSED ? (
            <Text style={[type.caption, styles.more]}>+{vitals.length - COLLAPSED} more</Text>
          ) : null}
        </>
      )}
    >
      <CardLink label="Open in Activity ›" hint="Opens More vitals in the Activity tab" onPress={onOpen} />
    </ExpandableCard>
  );
}

function Grid({ now, vitals, units, withAge }: { now: number; vitals: VitalView[]; units: Units; withAge: boolean }) {
  return (
    <View style={styles.grid}>
      {vitals.map((vital) => {
        const value = shown(vital, units);
        return (
          <View key={vital.metric.id} style={styles.tile}>
            <View style={styles.tileLabel}>
              <Feather name={vital.metric.icon} size={layout.icon.inline} color={colors.textMuted} />
              <Text style={[type.caption, styles.muted]} numberOfLines={1}>
                {vital.metric.shortLabel}
              </Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={[type.statMedium, styles.value]} numberOfLines={1} adjustsFontSizeToFit>
                {value.value}
              </Text>
              {value.unit ? <Text style={[type.caption, styles.muted, styles.unitGap]}>{value.unit}</Text> : null}
            </View>
            {withAge ? (
              <Text style={[type.caption, styles.muted]} numberOfLines={1}>
                {formatAge(now - vital.latest.timestamp.getTime())}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, rowGap: spacing.md },
  tile: {
    width: '50%',
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
  },
  tileLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xs },
  value: { color: colors.text, flexShrink: 1 },
  muted: { color: colors.textMuted },
  unitGap: { marginLeft: spacing.xs },
  more: { color: colors.textMuted, marginTop: spacing.sm },
});
