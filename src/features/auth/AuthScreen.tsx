import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Logo } from '@/components/ui/Logo';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { unitLabels } from '@/lib/measures';
import type { Units } from '@/lib/measures';
import { colors, layout, spacing, type } from '@/theme';
import type {
  AuthBusy,
  AuthConfirmation,
  AuthFieldErrors,
  AuthFormValues,
  AuthMode,
  Notice,
} from './authErrors';

export type AuthScreenProps = {
  units: Units;
  mode: AuthMode;
  values: AuthFormValues;
  avatarUri: string | null;
  fieldErrors: AuthFieldErrors;
  formError: string | null;
  notice: Notice | null;
  confirmation: AuthConfirmation | null;
  busy: AuthBusy;
  previewMode: boolean;
  onChangeMode: (mode: AuthMode) => void;
  onChangeValue: (field: keyof AuthFormValues, value: string) => void;
  onSignIn: () => void;
  onSignInWithGoogle: () => void;
  onSignUp: () => void;
  onSignUpWithGoogle: () => void;
  onSendPasswordReset: () => void;
  onChooseProfilePicture: () => void;
  onDismissConfirmation: () => void;
  onPreview?: () => void;
};

const copy = {
  login: { title: 'Welcome back', blurb: 'Log in to see your heart rate, activity and sleep.' },
  register: { title: 'Create your account', blurb: 'Pair your watch and keep your health history in one place.' },
};

export function AuthScreen(props: AuthScreenProps) {
  const { mode, confirmation, previewMode, onPreview } = props;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        scroll
        hero={
          <View>
            <View style={styles.brandRow}>
              <Logo />
              <Text style={[type.subheading, styles.brand]}>DSS Wearables</Text>
            </View>
            <Text style={[type.title, styles.title]} accessibilityRole="header">
              {confirmation ? 'Check your email' : copy[mode].title}
            </Text>
            <Text style={[type.body, styles.blurb]}>
              {confirmation ? 'One more step before you can log in.' : copy[mode].blurb}
            </Text>
          </View>
        }
      >
        {confirmation ? <ConfirmationCard {...props} confirmation={confirmation} /> : <FormCard {...props} />}

        {__DEV__ && previewMode && onPreview ? (
          <View style={styles.previewBlock}>
            <Pill label="Preview mode · no Firebase connected" tier="neutral" icon="info" />
            <Button
              label="Preview the dashboard"
              variant="secondary"
              icon="eye"
              size="md"
              fullWidth
              onPress={onPreview}
              style={styles.previewButton}
            />
          </View>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function ConfirmationCard({
  confirmation,
  onDismissConfirmation,
}: AuthScreenProps & { confirmation: AuthConfirmation }) {
  const verification = confirmation.kind === 'verification-sent';
  return (
    <Card style={styles.card}>
      <EmptyState
        icon={verification ? 'mail' : 'key'}
        title={verification ? 'Verification email sent' : 'Password reset email sent'}
        message={
          verification
            ? `We sent a verification link to ${confirmation.email}. Open it, then log in.`
            : `We sent a password reset link to ${confirmation.email}. Follow it to choose a new password.`
        }
      />
      <Button label="Back to log in" onPress={onDismissConfirmation} fullWidth />
    </Card>
  );
}

function FormCard(props: AuthScreenProps) {
  const {
    units,
    mode,
    values,
    avatarUri,
    fieldErrors,
    formError,
    notice,
    busy,
    onChangeMode,
    onChangeValue,
    onSignIn,
    onSignInWithGoogle,
    onSignUp,
    onSignUpWithGoogle,
    onSendPasswordReset,
    onChooseProfilePicture,
  } = props;
  const register = mode === 'register';
  const locked = busy !== null;

  return (
    <Card style={styles.card}>
      <SegmentedControl
        value={mode}
        onChange={(next) => !locked && onChangeMode(next)}
        options={[
          { value: 'login', label: 'Log in' },
          { value: 'register', label: 'Register' },
        ]}
      />

      <View style={styles.form}>
        {notice ? <ErrorBanner message={notice.message} tone={notice.tone} /> : null}

        {register ? (
          <>
            <View style={styles.avatarBlock}>
              <Avatar
                uri={avatarUri}
                name={values.name}
                size={layout.avatarLarge}
                onPress={onChooseProfilePicture}
                accessibilityLabel="Choose a profile picture (optional)"
              />
              <Text style={[type.caption, styles.muted]}>Profile picture (optional)</Text>
            </View>
            <TextField
              label="Name (optional)"
              value={values.name}
              onChangeText={(v) => onChangeValue('name', v)}
              placeholder="Alex Chen"
              icon="user"
              autoCapitalize="words"
              autoComplete="name"
              error={fieldErrors.name}
            />
            <View style={styles.row}>
              <TextField
                label={`Height (${unitLabels(units).height})`}
                value={values.height}
                onChangeText={(v) => onChangeValue('height', v)}
                placeholder="Optional"
                keyboardType="decimal-pad"
                error={fieldErrors.height}
                style={styles.half}
              />
              <TextField
                label={`Weight (${unitLabels(units).weight})`}
                value={values.weight}
                onChangeText={(v) => onChangeValue('weight', v)}
                placeholder="Optional"
                keyboardType="decimal-pad"
                error={fieldErrors.weight}
                style={styles.half}
              />
            </View>
          </>
        ) : null}

        <TextField
          label="Email"
          value={values.email}
          onChangeText={(v) => onChangeValue('email', v)}
          placeholder="you@latrobe.edu.au"
          icon="mail"
          keyboardType="email-address"
          autoComplete="email"
          error={fieldErrors.email}
        />
        <TextField
          label="Password"
          value={values.password}
          onChangeText={(v) => onChangeValue('password', v)}
          placeholder={register ? 'At least 6 characters' : 'Your password'}
          icon="lock"
          secure
          autoComplete={register ? 'new-password' : 'password'}
          error={fieldErrors.password}
        />
        {register ? (
          <TextField
            label="Confirm password"
            value={values.confirmPassword}
            onChangeText={(v) => onChangeValue('confirmPassword', v)}
            placeholder="Type it again"
            icon="lock"
            secure
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
          />
        ) : null}

        {formError ? <ErrorBanner message={formError} /> : null}

        <Button
          label={register ? 'Sign up' : 'Log in'}
          onPress={register ? onSignUp : onSignIn}
          loading={busy === 'email'}
          disabled={locked}
          fullWidth
        />

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={[type.caption, styles.muted]}>or</Text>
          <View style={styles.line} />
        </View>

        <Button
          label={register ? 'Sign up with Google' : 'Sign in with Google'}
          variant="secondary"
          ionicon="logo-google"
          onPress={register ? onSignUpWithGoogle : onSignInWithGoogle}
          loading={busy === 'google'}
          disabled={locked}
          fullWidth
        />

        {register ? (
          <Text style={[type.caption, styles.legal]}>
            By registering you agree to let DSS Wearables store your health metrics so you can review them later.
          </Text>
        ) : (
          <Button
            label="Forgot password?"
            variant="ghost"
            size="md"
            onPress={onSendPasswordReset}
            loading={busy === 'reset'}
            disabled={locked}
            fullWidth
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  brand: { color: colors.textOnAccent, marginLeft: spacing.md },
  title: { color: colors.textOnAccent, marginTop: spacing.xxl },
  blurb: { color: colors.textOnAccentMuted, marginTop: spacing.xs },
  card: { marginTop: spacing.xl },
  form: { marginTop: spacing.xl, gap: spacing.lg },
  avatarBlock: { alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  muted: { color: colors.textMuted },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  legal: { color: colors.textMuted, textAlign: 'center' },
  previewBlock: { marginTop: spacing.xl, alignItems: 'center' },
  previewButton: { marginTop: spacing.md },
});
