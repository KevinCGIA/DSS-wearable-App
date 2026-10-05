import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { AlertItem } from '@/data/types';
import { formatShortDate, isSameDay } from '@/lib/time';
import { colors, layout, radius, spacing, type } from '@/theme';

export type NotificationsScreenProps = {
  now: number;
  alerts: AlertItem[];
  loading: boolean;
  error: string | null;
  onClearAll: () => void;
  onOpenAlertThresholds: () => void;
  onRetry: () => void;
  onBack: () => void;
  onAddTestAlert?: () => void;
};

type DayGroup = { title: string; items: AlertItem[] };

function groupByDay(alerts: AlertItem[], now: number): DayGroup[] {
  const today = new Date(now);
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  const groups: DayGroup[] = [];
  for (const alert of alerts) {
    const date = new Date(alert.timestamp);
    const title = isSameDay(date, today) ? 'Today' : isSameDay(date, yesterday) ? 'Yesterday' : formatShortDate(date);
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.items.push(alert);
    else groups.push({ title, items: [alert] });
  }
  return groups;
}

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export function NotificationsScreen({
  now,
  alerts,
  loading,
  error,
  onClearAll,
  onOpenAlertThresholds,
  onRetry,
  onBack,
  onAddTestAlert,
}: NotificationsScreenProps) {
  const groups = groupByDay(alerts, now);

  return (
    <Screen
      scroll
      hero={
        <HeroHeader
          title="Notifications"
          subtitle="Heart rate alerts from your thresholds."
          onBack={onBack}
          right={
            alerts.length > 0 ? (
              <IconButton icon="trash-2" variant="onAccent" accessibilityLabel="Clear all alerts" onPress={onClearAll} />
            ) : undefined
          }
        />
      }
    >
      {loading ? (
        <Card style={styles.first}>
          <ActivityIndicator color={colors.accent} style={styles.spinner} />
        </Card>
      ) : error ? (
        <ErrorBanner message={error} actionLabel="Retry" onAction={onRetry} style={styles.first} />
      ) : alerts.length === 0 ? (
        <Card style={styles.first}>
          <EmptyState
            icon="bell"
            title="No alerts yet"
            message="When your heart rate goes above or below your thresholds, alerts will show here."
            actionLabel="Set alert thresholds"
            onAction={onOpenAlertThresholds}
          />
        </Card>
      ) : (
        groups.map((group, index) => (
          <View key={group.title}>
            <SectionLabel title={group.title} first={index === 0} />
            <Card padding={0}>
              {group.items.map((alert, i) => (
                <AlertRow key={alert.id} alert={alert} divider={i > 0} />
              ))}
            </Card>
          </View>
        ))
      )}

      {onAddTestAlert ? (
        <Card style={styles.card}>
          <CardTitle icon="tool" title="Development" />
          <Button
            label="Add Test Alert"
            variant="secondary"
            size="md"
            onPress={onAddTestAlert}
            fullWidth
            style={styles.devButton}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

function AlertRow({ alert, divider }: { alert: AlertItem; divider: boolean }) {
  const high = alert.type === 'HR_HIGH';
  return (
    <View
      style={[styles.row, divider && styles.divider]}
      accessible
      accessibilityLabel={`${high ? 'High' : 'Low'} heart rate alert, ${alert.value} BPM, ${alert.message}, at ${formatTime(alert.timestamp)}`}
    >
      <View style={[styles.badge, high ? styles.badgeHigh : styles.badgeLow]}>
        <Feather name={high ? 'arrow-up' : 'arrow-down'} size={layout.icon.row} color={high ? colors.danger : colors.warning} />
      </View>
      <View style={styles.text}>
        <Text style={[type.bodyStrong, styles.title]}>{high ? 'High heart rate' : 'Low heart rate'}</Text>
        <Text style={[type.caption, styles.muted]} numberOfLines={2}>
          {alert.message}
        </Text>
      </View>
      <View style={styles.meta}>
        <View style={styles.valueRow}>
          <Text style={[type.statSmall, high ? styles.valueHigh : styles.valueLow]}>{alert.value}</Text>
          <Text style={[type.unit, styles.muted, styles.unitGap]}>BPM</Text>
        </View>
        <Text style={[type.caption, styles.muted]}>{formatTime(alert.timestamp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: spacing.xl },
  card: { marginTop: spacing.lg },
  spinner: { marginVertical: spacing.huge },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, minHeight: layout.rowHeightTall },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  badge: {
    width: layout.iconBadge,
    height: layout.iconBadge,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeHigh: { backgroundColor: colors.dangerSurface },
  badgeLow: { backgroundColor: colors.warningSurface },
  text: { flex: 1 },
  title: { color: colors.text },
  muted: { color: colors.textMuted },
  meta: { alignItems: 'flex-end' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  unitGap: { marginLeft: spacing.xs },
  valueHigh: { color: colors.danger },
  valueLow: { color: colors.warning },
  devButton: { marginTop: spacing.lg },
});
