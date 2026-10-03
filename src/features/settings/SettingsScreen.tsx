import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Toggle } from '@/components/ui/Toggle';
import type { ConnectionState, PairedDevice, UserProfile } from '@/data/types';
import { CurrentDevice } from '@/features/devices/CurrentDevice';
import { PairedDeviceList } from '@/features/devices/PairedDeviceList';
import { colors, layout, spacing, type } from '@/theme';
import type { AccountBusy, ProfileForm, ProfileFormErrors, SettingsNotice } from './useSettingsData';

export type SettingsScreenProps = {
  bottomInset: number;
  now: number;
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  form: ProfileForm;
  formErrors: ProfileFormErrors;
  saving: boolean;
  profileNotice: SettingsNotice | null;
  newEmail: string;
  emailError?: string;
  accountBusy: AccountBusy;
  accountNotice: SettingsNotice | null;
  connection: ConnectionState;
  pairedDevices: PairedDevice[];
  autoConnect: boolean;
  onRetryProfile: () => void;
  onChangeForm: (field: keyof ProfileForm, value: string) => void;
  onChooseProfilePicture: () => void;
  onSaveProfile: () => void;
  onChangeNewEmail: (value: string) => void;
  onChangeEmail: () => void;
  onChangePassword: () => void;
  onConnect: (device: { id: string; name: string | null }) => void;
  onDisconnect: () => void;
  onForgetDevice: (device: PairedDevice) => void;
  onSetAutoConnect: (enabled: boolean) => void;
  onOpenDevices: () => void;
  onOpenAlertThresholds: () => void;
  onOpenNotifications: () => void;
  onOpenPreferences: () => void;
  onLogout: () => void;
  onOpenPreviews?: () => void;
};

export function SettingsScreen(props: SettingsScreenProps) {
  const { bottomInset, profile, onOpenPreviews } = props;

  return (
    <Screen
      scroll
      bottomInset={bottomInset}
      hero={<HeroHeader title="Settings" subtitle={profile?.email || undefined} />}
    >
      <Section title="Profile" first />
      <ProfileCard {...props} />

      <Section title="Devices" />
      <DevicesCard {...props} />

      <Section title="Account & Security" />
      <AccountCard {...props} />

      <Section title="Alerts & Preferences" />
      <Card padding={0}>
        <ListRow icon="bell" label="Alert Thresholds" onPress={props.onOpenAlertThresholds} />
        <ListRow icon="inbox" label="Notifications" onPress={props.onOpenNotifications} divider />
        <ListRow icon="sliders" label="Preferences" onPress={props.onOpenPreferences} divider />
      </Card>

      <Section title="Account" />
      <Card padding={0}>
        <ListRow icon="log-out" label="Log Out" onPress={props.onLogout} destructive chevron={false} />
      </Card>

      {onOpenPreviews ? (
        <>
          <Section title="Development" />
          <Card padding={0}>
            <ListRow icon="eye" label="Previews" hint="Every screen in every state" onPress={onOpenPreviews} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Section({ title, first = false }: { title: string; first?: boolean }) {
  return (
    <Text style={[type.label, styles.section, first && styles.sectionFirst]} accessibilityRole="header">
      {title.toUpperCase()}
    </Text>
  );
}

function ProfileCard({
  profile,
  profileLoading,
  profileError,
  form,
  formErrors,
  saving,
  profileNotice,
  onRetryProfile,
  onChangeForm,
  onChooseProfilePicture,
  onSaveProfile,
}: SettingsScreenProps) {
  if (profileLoading) {
    return (
      <Card>
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      </Card>
    );
  }
  if (profileError) {
    return <ErrorBanner message={profileError} actionLabel="Retry" onAction={onRetryProfile} />;
  }

  return (
    <Card>
      <View style={styles.avatarBlock}>
        <Avatar
          uri={profile?.avatarData ?? null}
          name={form.name || profile?.name}
          size={layout.avatarLarge}
          onPress={onChooseProfilePicture}
          accessibilityLabel="Change profile picture"
        />
        <Button label="Change Profile Picture" variant="ghost" size="sm" onPress={onChooseProfilePicture} />
      </View>

      <View style={styles.fields}>
        {profileNotice ? <ErrorBanner message={profileNotice.message} tone={profileNotice.tone} /> : null}
        <TextField
          label="Name"
          value={form.name}
          onChangeText={(v) => onChangeForm('name', v)}
          placeholder="Enter your name"
          icon="user"
          autoCapitalize="words"
          autoComplete="name"
          error={formErrors.name}
        />
        <View style={styles.row}>
          <TextField
            label="Height (cm)"
            value={form.height}
            onChangeText={(v) => onChangeForm('height', v)}
            placeholder="e.g. 178"
            keyboardType="decimal-pad"
            error={formErrors.height}
            style={styles.half}
          />
          <TextField
            label="Weight (kg)"
            value={form.weight}
            onChangeText={(v) => onChangeForm('weight', v)}
            placeholder="e.g. 72"
            keyboardType="decimal-pad"
            error={formErrors.weight}
            style={styles.half}
          />
        </View>
        <Button label="Save Changes" onPress={onSaveProfile} loading={saving} fullWidth />
      </View>
    </Card>
  );
}

function DevicesCard({
  now,
  connection,
  pairedDevices,
  autoConnect,
  onConnect,
  onDisconnect,
  onForgetDevice,
  onSetAutoConnect,
  onOpenDevices,
}: SettingsScreenProps) {
  return (
    <Card padding={0}>
      <CurrentDevice connection={connection} onDisconnect={onDisconnect} />
      <Toggle
        label="Auto-connect"
        hint="Reconnect to your last device when the app opens"
        value={autoConnect}
        onValueChange={onSetAutoConnect}
        divider
      />
      <ListRow icon="bluetooth" label="Pair a New Device" onPress={onOpenDevices} divider />
      <View style={styles.pairedHead}>
        <Text style={[type.label, styles.pairedTitle]}>Paired devices</Text>
      </View>
      <PairedDeviceList
        pairedDevices={pairedDevices}
        connection={connection}
        now={now}
        onConnect={onConnect}
        onForgetDevice={onForgetDevice}
      />
    </Card>
  );
}

function AccountCard({
  profile,
  newEmail,
  emailError,
  accountBusy,
  accountNotice,
  onChangeNewEmail,
  onChangeEmail,
  onChangePassword,
}: SettingsScreenProps) {
  const locked = accountBusy !== null;
  return (
    <Card>
      <View style={styles.fields}>
        {accountNotice ? <ErrorBanner message={accountNotice.message} tone={accountNotice.tone} /> : null}
        <TextField
          label="New Email"
          value={newEmail}
          onChangeText={onChangeNewEmail}
          placeholder="Enter your new email"
          icon="mail"
          keyboardType="email-address"
          autoComplete="email"
          error={emailError}
        />
        <Button
          label="Change Email"
          variant="secondary"
          onPress={onChangeEmail}
          loading={accountBusy === 'email'}
          disabled={locked}
          fullWidth
        />
        <View style={styles.separator} />
        <Text style={[type.caption, styles.hint]}>
          We'll email a password reset link to {profile?.email || 'your account email'}.
        </Text>
        <Button
          label="Change Password"
          variant="secondary"
          icon="lock"
          onPress={onChangePassword}
          loading={accountBusy === 'password'}
          disabled={locked}
          fullWidth
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionFirst: { marginTop: spacing.xl },
  spinner: { marginVertical: spacing.xxl },
  avatarBlock: { alignItems: 'center', gap: spacing.xs },
  fields: { gap: spacing.lg, marginTop: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  pairedHead: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pairedTitle: { color: colors.textMuted },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  hint: { color: colors.textMuted },
});
