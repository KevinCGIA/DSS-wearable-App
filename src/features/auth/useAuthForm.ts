import { useCallback, useState } from 'react';
import { parseMeasure } from '@/lib/measures';
import { pickSquareImage } from '@/lib/pickImage';
import { describeAuthError, isValidEmail, validateAuthInput } from './authErrors';
import type {
  AuthBusy,
  AuthConfirmation,
  AuthFieldErrors,
  AuthFormValues,
  AuthMode,
  Notice,
} from './authErrors';
import { authService } from './authService';

const emptyValues: AuthFormValues = {
  name: '',
  height: '',
  weight: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function nameFromEmail(email: string): string {
  const local = email.trim().split('@')[0]?.split(/[._+-]/)[0] ?? '';
  return local ? local[0].toUpperCase() + local.slice(1) : 'Tarun';
}

type Options = {
  // Set only in preview mode (no Firebase keys): enters the app without an account.
  onPreview?: (displayName: string) => void;
};

export function useAuthForm({ onPreview }: Options) {
  const [mode, setModeState] = useState<AuthMode>('login');
  const [values, setValues] = useState<AuthFormValues>(emptyValues);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmation, setConfirmation] = useState<AuthConfirmation | null>(null);
  const [busy, setBusy] = useState<AuthBusy>(null);

  const clearMessages = () => {
    setFieldErrors({});
    setFormError(null);
    setNotice(null);
  };

  const setMode = useCallback((next: AuthMode) => {
    setModeState(next);
    setFieldErrors({});
    setFormError(null);
    setNotice(null);
  }, []);

  const setValue = useCallback((field: keyof AuthFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const enterPreview = (name: string) => onPreview?.(name);

  const signIn = async () => {
    clearMessages();
    const errors = validateAuthInput('login', values);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setBusy('email');
    try {
      const result = await authService.signIn(values.email.trim(), values.password);
      if (result === 'unverified') {
        setNotice({ tone: 'warning', message: 'Please verify your email before signing in.' });
        return;
      }
      if (authService.mode === 'preview') enterPreview(nameFromEmail(values.email));
    } catch (error) {
      setFormError(describeAuthError(error));
    } finally {
      setBusy(null);
    }
  };

  const signUp = async () => {
    clearMessages();
    const errors = validateAuthInput('register', values);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setBusy('email');
    try {
      await authService.signUp({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        height: parseMeasure(values.height),
        weight: parseMeasure(values.weight),
        avatarUri,
      });
      setConfirmation({ kind: 'verification-sent', email: values.email.trim() });
      setValues((prev) => ({ ...emptyValues, email: prev.email }));
    } catch (error) {
      setFormError(describeAuthError(error));
    } finally {
      setBusy(null);
    }
  };

  const google = async (action: () => Promise<void>) => {
    clearMessages();
    setBusy('google');
    try {
      await action();
      if (authService.mode === 'preview') enterPreview(values.name.trim() || 'Tarun');
    } catch (error) {
      setFormError(describeAuthError(error));
    } finally {
      setBusy(null);
    }
  };

  const signInWithGoogle = () => google(authService.signInWithGoogle);
  const signUpWithGoogle = () => google(authService.signUpWithGoogle);

  // Same reset email as Android's changePassword() in Settings.
  const sendPasswordReset = async () => {
    clearMessages();
    if (!isValidEmail(values.email)) {
      setFieldErrors({ email: 'Enter your email above, then tap Forgot password.' });
      return;
    }
    setBusy('reset');
    try {
      await authService.sendPasswordReset(values.email.trim());
      setConfirmation({ kind: 'reset-sent', email: values.email.trim() });
    } catch (error) {
      setFormError(describeAuthError(error));
    } finally {
      setBusy(null);
    }
  };

  // Android: chooseProfilePicture in app/register.tsx
  const chooseProfilePicture = async () => {
    setNotice(null);
    const picked = await pickSquareImage();
    if (picked.status === 'denied') {
      setNotice({ tone: 'warning', message: 'Please allow access to your photos.' });
    } else if (picked.status === 'picked') {
      setAvatarUri(picked.uri);
    }
  };

  const dismissConfirmation = () => {
    setConfirmation(null);
    setModeState('login');
    setValues((prev) => ({ ...emptyValues, email: prev.email }));
    clearMessages();
  };

  return {
    mode,
    values,
    avatarUri,
    fieldErrors,
    formError,
    notice,
    confirmation,
    busy,
    previewMode: authService.mode === 'preview',
    onChangeMode: setMode,
    onChangeValue: setValue,
    onSignIn: signIn,
    onSignInWithGoogle: signInWithGoogle,
    onSignUp: signUp,
    onSignUpWithGoogle: signUpWithGoogle,
    onSendPasswordReset: sendPasswordReset,
    onChooseProfilePicture: chooseProfilePicture,
    onDismissConfirmation: dismissConfirmation,
    onPreview: onPreview ? () => enterPreview(values.name.trim() || 'Tarun') : undefined,
  };
}
