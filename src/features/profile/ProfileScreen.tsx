import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import type { UserProfile } from '@/data/types';
import { colors, layout, spacing, type } from '@/theme';
import type { AccountBusy, ProfileForm, ProfileFormErrors, ProfileNotice } from './useProfileData';

export type ProfileScreenProps = {
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  form: ProfileForm;
  formErrors: ProfileFormErrors;
  saving: boolean;
  dirty: boolean;
  profileNotice: ProfileNotice | null;
  newEmail: string;
  emailError?: string;
  accountBusy: AccountBusy;
  accountNotice: ProfileNotice | null;
  onRetryProfile: () => void;
  onChangeForm: (field: keyof ProfileForm, value: string) => void;
  onChooseProfilePicture: () => void;
  onSaveProfile: () => void;
  onChangeNewEmail: (value: string) => void;
  onChangeEmail: () => void;
  onChangePassword: () => void;
  onBack: () => void;
};

export function ProfileScreen(props: ProfileScreenProps) {
  const { profile, profileLoading, profileError, onRetryProfile, onBack } = props;

  return (
    <Screen
      scroll
      hero={<HeroHeader title="Profile" subtitle={profile?.email || undefined} onBack={onBack} />}
    >
      {profileLoading ? (
        <Card style={styles.first}>
          <ActivityIndicator color={colors.accent} style={styles.spinner} />
        </Card>
      ) : profileError ? (
        <ErrorBanner message={profileError} actionLabel="Retry" onAction={onRetryProfile} style={styles.first} />
      ) : (
        <>
          <Section title="Personal details" first />
          <DetailsCard {...props} />
          <Section title="Account" />
          <AccountCard {...props} />
        </>
      )}
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

function DetailsCard({
  profile,
  form,
  formErrors,
  saving,
  dirty,
  profileNotice,
  onChangeForm,
  onChooseProfilePicture,
  onSaveProfile,
}: ProfileScreenProps) {
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
        <Button
          label={dirty || saving ? 'Save Changes' : 'Saved'}
          icon={dirty || saving ? undefined : 'check'}
          onPress={onSaveProfile}
          loading={saving}
          disabled={!dirty}
          fullWidth
        />
      </View>
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
}: ProfileScreenProps) {
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
  first: { marginTop: spacing.xl },
  spinner: { marginVertical: spacing.xxl },
  section: {
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionFirst: { marginTop: spacing.xl },
  avatarBlock: { alignItems: 'center', gap: spacing.xs },
  fields: { gap: spacing.lg, marginTop: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  hint: { color: colors.textMuted },
});
