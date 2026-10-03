import { useCallback, useEffect, useState } from 'react';
import type { UserProfile } from '@/data/types';
import { describeAuthError, isValidEmail } from '@/features/auth/authErrors';
import { formatMeasure, HEIGHT_RANGE, measureError, parseMeasure, WEIGHT_RANGE } from '@/lib/measures';
import { pickSquareImage } from '@/lib/pickImage';
import { useUnsavedChangesGuard } from '@/navigation/unsavedChanges';
import { accountService } from './accountService';
import { useProfile } from './ProfileProvider';

// Moved unchanged from the old Settings hook. Handlers keep Android's names
// (chooseProfilePicture, saveProfile, changeEmail, changePassword in app/(auth)/settings.tsx).

export type ProfileForm = { name: string; height: string; weight: string };
export type ProfileFormErrors = Partial<Record<keyof ProfileForm, string>>;
export type ProfileNotice = { tone: 'success' | 'error' | 'info'; message: string };
export type AccountBusy = 'email' | 'password' | null;

const toForm = (p: UserProfile): ProfileForm => ({
  name: p.name,
  height: formatMeasure(p.height),
  weight: formatMeasure(p.weight),
});

export function useProfileData() {
  const { profile, loading: profileLoading, error: profileError, reload, update } = useProfile();

  const [form, setForm] = useState<ProfileForm>({ name: '', height: '', weight: '' });
  const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<ProfileNotice | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [accountBusy, setAccountBusy] = useState<AccountBusy>(null);
  const [accountNotice, setAccountNotice] = useState<ProfileNotice | null>(null);

  // Fill the form once the profile has loaded (or reloaded after Retry).
  useEffect(() => {
    if (profile && !profileLoading) setForm(toForm(profile));
  }, [profileLoading]);

  const profileDirty =
    profile !== null &&
    (form.name !== toForm(profile).name ||
      form.height !== toForm(profile).height ||
      form.weight !== toForm(profile).weight);
  useUnsavedChangesGuard(profileDirty, "Your profile changes haven't been saved.");

  const changeForm = useCallback((field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    setProfileNotice(null);
  }, []);

  const saveProfile = async () => {
    const errors: ProfileFormErrors = {};
    const height = measureError(form.height, HEIGHT_RANGE, 'Enter a height in cm');
    const weight = measureError(form.weight, WEIGHT_RANGE, 'Enter a weight in kg');
    if (height) errors.height = height;
    if (weight) errors.weight = weight;
    setFormErrors(errors);
    setProfileNotice(null);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      const changes = { name: form.name.trim(), height: parseMeasure(form.height), weight: parseMeasure(form.weight) };
      await accountService.saveProfile(changes);
      update(changes);
      setForm(toForm({ ...(profile as UserProfile), ...changes }));
      setProfileNotice({ tone: 'success', message: 'Profile updated successfully!' });
    } catch (error) {
      setProfileNotice({ tone: 'error', message: `Failed to update profile: ${describeAuthError(error)}` });
    } finally {
      setSaving(false);
    }
  };

  // Android: chooseProfilePicture in app/(auth)/settings.tsx (saves straight away)
  const chooseProfilePicture = async () => {
    setProfileNotice(null);
    const picked = await pickSquareImage();
    if (picked.status === 'denied') {
      setProfileNotice({ tone: 'error', message: 'Please allow access to your photos to choose a profile picture.' });
      return;
    }
    if (picked.status !== 'picked') return;
    try {
      await accountService.saveProfilePicture(picked.uri);
      update({ avatarData: picked.uri });
      setProfileNotice({ tone: 'success', message: 'Profile picture updated successfully!' });
    } catch (error) {
      setProfileNotice({ tone: 'error', message: `Failed to update profile picture: ${describeAuthError(error)}` });
    }
  };

  const changeEmail = async () => {
    setAccountNotice(null);
    if (!newEmail.trim()) {
      setEmailError('Please enter your new email address.');
      return;
    }
    if (!isValidEmail(newEmail)) {
      setEmailError("That email address doesn't look right.");
      return;
    }
    setEmailError(undefined);
    setAccountBusy('email');
    try {
      await accountService.changeEmail(newEmail.trim());
      setAccountNotice({
        tone: 'success',
        message: `Verification email sent to ${newEmail.trim()}. Click the link to finish changing your email.`,
      });
      setNewEmail('');
    } catch (error) {
      setAccountNotice({ tone: 'error', message: `Failed to change email: ${describeAuthError(error)}` });
    } finally {
      setAccountBusy(null);
    }
  };

  const changePassword = async () => {
    setAccountNotice(null);
    setAccountBusy('password');
    try {
      const email = await accountService.changePassword();
      setAccountNotice({
        tone: 'success',
        message: email
          ? `Password reset email sent to ${email}. Click the link to choose a new password.`
          : 'Password reset email sent. Click the link in it to choose a new password.',
      });
    } catch (error) {
      setAccountNotice({ tone: 'error', message: `Failed to send password reset email: ${describeAuthError(error)}` });
    } finally {
      setAccountBusy(null);
    }
  };

  return {
    profile,
    profileLoading,
    profileError,
    form,
    formErrors,
    saving,
    dirty: profileDirty,
    profileNotice,
    newEmail,
    emailError,
    accountBusy,
    accountNotice,
    onRetryProfile: reload,
    onChangeForm: changeForm,
    onChooseProfilePicture: chooseProfilePicture,
    onSaveProfile: saveProfile,
    onChangeNewEmail: (value: string) => {
      setNewEmail(value);
      setEmailError(undefined);
    },
    onChangeEmail: changeEmail,
    onChangePassword: changePassword,
  };
}
