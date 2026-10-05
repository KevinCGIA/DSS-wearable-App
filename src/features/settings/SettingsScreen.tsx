import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { UserProfile } from '@/data/types';
import { colors, layout, spacing, type } from '@/theme';

export type SettingsScreenProps = {
  bottomInset: number;
  profile: UserProfile | null;
  profileLoading: boolean;
  onOpenProfile: () => void;
  onOpenAlertThresholds: () => void;
  onOpenNotifications: () => void;
  onOpenPreferences: () => void;
  onLogout: () => void;
  onOpenPreviews?: () => void;
};

export function SettingsScreen(props: SettingsScreenProps) {
  const { bottomInset, onOpenPreviews } = props;

  return (
    <Screen scroll bottomInset={bottomInset} hero={<HeroHeader title="Settings" />}>
      <ProfileRow {...props} />

      <SectionLabel title="Alerts & Preferences" />
      <Card padding={0}>
        <ListRow icon="bell" label="Alert Thresholds" onPress={props.onOpenAlertThresholds} />
        <ListRow icon="inbox" label="Notifications" onPress={props.onOpenNotifications} divider />
        <ListRow icon="sliders" label="Preferences" onPress={props.onOpenPreferences} divider />
      </Card>

      {onOpenPreviews ? (
        <>
          <SectionLabel title="Development" />
          <Card padding={0}>
            <ListRow icon="eye" label="Previews" hint="Every screen in every state" onPress={onOpenPreviews} />
          </Card>
        </>
      ) : null}

      <SectionLabel title="Account" />
      <Card padding={0}>
        <ListRow icon="log-out" label="Log Out" onPress={props.onLogout} destructive chevron={false} />
      </Card>
    </Screen>
  );
}


function ProfileRow({ profile, profileLoading, onOpenProfile }: SettingsScreenProps) {
  const name = profile?.name.trim() || 'Your profile';
  return (
    <Card padding={0} style={styles.first}>
      <Pressable
        onPress={onOpenProfile}
        accessibilityRole="button"
        accessibilityLabel={`Profile, ${name}${profile?.email ? `, ${profile.email}` : ''}`}
        accessibilityHint="Edit your name, photo, email and password"
        style={({ pressed }) => [styles.profileRow, pressed && styles.pressed]}
      >
        <Avatar uri={profile?.avatarData ?? null} name={profile?.name} loading={profileLoading} />
        <View style={styles.profileText}>
          <Text style={[type.subheading, styles.name]} numberOfLines={1}>
            {profileLoading ? 'Loading…' : name}
          </Text>
          {profile?.email ? (
            <Text style={[type.caption, styles.muted]} numberOfLines={1}>
              {profile.email}
            </Text>
          ) : null}
        </View>
        {profileLoading ? <ActivityIndicator size="small" color={colors.accent} /> : null}
        <Feather name="chevron-right" size={layout.icon.action} color={colors.textMuted} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: spacing.xl },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: layout.rowHeightTall,
  },
  pressed: { backgroundColor: colors.surfaceSunken },
  profileText: { flex: 1 },
  name: { color: colors.text },
  muted: { color: colors.textMuted },
});
