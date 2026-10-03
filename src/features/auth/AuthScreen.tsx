import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { colors, radius, spacing, type } from '@/theme';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { describeAuthError, validateAuthInput } from './authErrors';

type Mode = 'login' | 'register';

type Props = {
  onPreview?: (displayName: string) => void;
};

export function AuthScreen({ onPreview }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'email' | 'password', string>>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const copy = useMemo(
    () =>
      mode === 'login'
        ? { title: 'Welcome back', blurb: 'Sign in to pick up where your last session left off.', cta: 'Log in' }
        : { title: 'Start tracking', blurb: 'Create an account to pair your band and keep your history in one place.', cta: 'Create account' },
    [mode],
  );

  function switchMode(next: Mode) {
    setMode(next);
    setFieldErrors({});
    setFormError('');
  }

  async function submit() {
    const values = { name, email, password };
    const errors = validateAuthInput(mode, values);
    setFieldErrors(errors);
    setFormError('');

    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      setFormError(describeAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll background={colors.surface}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brandRow}>
          <LinearGradient
            colors={[...colors.accentGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mark}
          >
            <Feather name="activity" size={22} color={colors.textOnAccent} />
          </LinearGradient>
          <Text style={[type.heading, styles.brandName]}>DSS Wearables</Text>
        </View>

        <Text style={[type.title, styles.title]}>{copy.title}</Text>
        <Text style={[type.body, styles.blurb]}>{copy.blurb}</Text>

        <SegmentedControl
          value={mode}
          onChange={switchMode}
          options={[
            { value: 'login', label: 'Log in' },
            { value: 'register', label: 'Register' },
          ]}
          style={styles.toggle}
        />

        <View style={styles.form}>
          {mode === 'register' ? (
            <TextField
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Alex Chen"
              icon="user"
              autoCapitalize="words"
              autoComplete="name"
              error={fieldErrors.name}
            />
          ) : null}

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@latrobe.edu.au"
            icon="mail"
            keyboardType="email-address"
            autoComplete="email"
            error={fieldErrors.email}
          />

          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
            icon="lock"
            secure
            autoComplete={mode === 'register' ? 'new-password' : 'password'}
            error={fieldErrors.password}
          />

          {formError ? (
            <View style={styles.formError}>
              <Feather name="alert-circle" size={16} color={colors.danger} />
              <Text style={[type.bodyStrong, styles.formErrorText]}>{formError}</Text>
            </View>
          ) : null}

          <Button label={copy.cta} onPress={submit} loading={busy} fullWidth style={styles.submit} />

          {mode === 'login' ? (
            <Button label="Forgot your password?" variant="ghost" size="md" fullWidth />
          ) : (
            <Text style={[type.caption, styles.legal]}>
              By registering you agree to let DSS Wearables store your health metrics so you can review them later.
            </Text>
          )}
        </View>

        {!isFirebaseConfigured && onPreview ? (
          <View style={styles.previewBlock}>
            <Pill
              label="Firebase keys missing — add them to .env"
              tier="alert"
              icon="alert-triangle"
              style={styles.configNotice}
            />
            <Button
              label="Preview the dashboard"
              variant="secondary"
              icon="eye"
              size="md"
              fullWidth
              onPress={() => onPreview(name.trim() || 'Tarun')}
              style={styles.previewButton}
            />
            <Text style={[type.caption, styles.previewHint]}>
              Design preview only — no account is created.
            </Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xxxl },
  mark: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { color: colors.text, marginLeft: spacing.md },
  title: { color: colors.text, marginTop: spacing.huge },
  blurb: { color: colors.textSecondary, marginTop: spacing.sm },
  toggle: { marginTop: spacing.xxl },
  form: { marginTop: spacing.xxl, gap: spacing.xl },
  formError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  formErrorText: { color: colors.danger, marginLeft: spacing.md, flex: 1 },
  submit: { marginTop: spacing.xs },
  legal: { color: colors.textMuted, textAlign: 'center' },
  previewBlock: { marginTop: spacing.xxl, alignItems: 'center' },
  configNotice: { alignSelf: 'center' },
  previewButton: { marginTop: spacing.lg },
  previewHint: { color: colors.textMuted, marginTop: spacing.sm },
});
