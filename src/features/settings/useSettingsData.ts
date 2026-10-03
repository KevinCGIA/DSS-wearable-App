import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { PairedDevice, UserProfile } from '@/data/types';
import { useBle } from '@/features/devices/BleProvider';
import { confirmForget } from '@/features/devices/bluetoothText';
import { describeAuthError, isValidEmail } from '@/features/auth/authErrors';
import { formatMeasure, HEIGHT_RANGE, measureError, parseMeasure, WEIGHT_RANGE } from '@/lib/measures';
import { useNow } from '@/lib/useNow';
import { accountService } from './accountService';

export type ProfileForm = { name: string; height: string; weight: string };
export type ProfileFormErrors = Partial<Record<keyof ProfileForm, string>>;
export type SettingsNotice = { tone: 'success' | 'error' | 'info'; message: string };
export type AccountBusy = 'email' | 'password' | null;

const toForm = (p: UserProfile): ProfileForm => ({
  name: p.name,
  height: formatMeasure(p.height),
  weight: formatMeasure(p.weight),
});

export function useSettingsData(displayName: string, signOut: () => void) {
  const ble = useBle();
  const now = useNow(60 * 1000);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>({ name: '', height: '', weight: '' });
  const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<SettingsNotice | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [accountBusy, setAccountBusy] = useState<AccountBusy>(null);
  const [accountNotice, setAccountNotice] = useState<SettingsNotice | null>(null);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const loaded = await accountService.loadProfile(displayName);
      setProfile(loaded);
      setForm(toForm(loaded));
    } catch (error) {
      setProfileError(`Failed to load profile: ${describeAuthError(error)}`);
    } finally {
      setProfileLoading(false);
    }
  }, [displayName]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
      const update = { name: form.name.trim(), height: parseMeasure(form.height), weight: parseMeasure(form.weight) };
      await accountService.saveProfile(update);
      setProfile((prev) => (prev ? { ...prev, ...update } : prev));
      setProfileNotice({ tone: 'success', message: 'Profile updated successfully!' });
    } catch (error) {
      setProfileNotice({ tone: 'error', message: `Failed to update profile: ${describeAuthError(error)}` });
    } finally {
      setSaving(false);
    }
  };

  // Phase 2: Android's chooseProfilePicture (expo-image-picker, 300×300 JPEG → users/{uid}/private/avatarData).
  const chooseProfilePicture = () => {
    setProfileNotice({
      tone: 'info',
      message: 'Choosing a photo is added with the shared Firebase setup.',
    });
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
        message: `Password reset email sent to ${email}. Click the link to choose a new password.`,
      });
    } catch (error) {
      setAccountNotice({
        tone: 'error',
        message: `Failed to send password reset email: ${describeAuthError(error)}`,
      });
    } finally {
      setAccountBusy(null);
    }
  };

  const forgetDevice = (device: PairedDevice) => confirmForget(device, ble.forgetDevice);

  // Android: logout in app/(auth)/settings.tsx
  const logout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return {
    now,
    profile,
    profileLoading,
    profileError,
    form,
    formErrors,
    saving,
    profileNotice,
    newEmail,
    emailError,
    accountBusy,
    accountNotice,
    connection: ble.connection,
    pairedDevices: ble.pairedDevices,
    autoConnect: ble.autoConnect,
    onRetryProfile: loadProfile,
    onChangeForm: changeForm,
    onChooseProfilePicture: chooseProfilePicture,
    onSaveProfile: saveProfile,
    onChangeNewEmail: (value: string) => {
      setNewEmail(value);
      setEmailError(undefined);
    },
    onChangeEmail: changeEmail,
    onChangePassword: changePassword,
    onConnect: (device: { id: string; name: string | null }) => {
      ble.connect(device);
    },
    onDisconnect: () => {
      ble.disconnect();
    },
    onForgetDevice: forgetDevice,
    onSetAutoConnect: (enabled: boolean) => {
      ble.setAutoConnect(enabled);
    },
    onLogout: logout,
  };
}
