import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, type } from '@/theme';

type Props = {
  bottomInset: number;
  onOpenDevices: () => void;
  onOpenAlertThresholds: () => void;
  onOpenNotifications: () => void;
  onOpenPreferences: () => void;
  onLogout: () => void;
  onOpenPreviews?: () => void;
};

export function SettingsScreen({
  bottomInset,
  onOpenDevices,
  onOpenAlertThresholds,
  onOpenNotifications,
  onOpenPreferences,
  onLogout,
  onOpenPreviews,
}: Props) {
  return (
    <Screen scroll bottomInset={bottomInset} hero={<HeroHeader title="Settings" />}>
      <Text style={[type.label, styles.section]}>Devices</Text>
      <Card padding={0}>
        <ListRow icon="bluetooth" label="Pair a New Device" onPress={onOpenDevices} />
      </Card>

      <Text style={[type.label, styles.section]}>Alerts</Text>
      <Card padding={0}>
        <ListRow icon="bell" label="Alert Thresholds" onPress={onOpenAlertThresholds} />
        <ListRow icon="inbox" label="Notifications" onPress={onOpenNotifications} divider />
        <ListRow icon="sliders" label="Preferences" onPress={onOpenPreferences} divider />
      </Card>

      <Text style={[type.label, styles.section]}>Account</Text>
      <Card padding={0}>
        <ListRow icon="log-out" label="Log Out" onPress={onLogout} destructive chevron={false} />
      </Card>

      {onOpenPreviews ? (
        <>
          <Text style={[type.label, styles.section]}>Development</Text>
          <Card padding={0}>
            <ListRow icon="eye" label="Previews" hint="Every screen in every state" onPress={onOpenPreviews} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
});
