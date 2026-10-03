import { heightRangeFor, measureError, weightRangeFor } from '@/lib/measures';
import type { Units } from '@/lib/measures';

const messages: Record<string, string> = {
  'auth/invalid-email': "That email address doesn't look right. Check it and try again.",
  'auth/missing-email': 'Enter your email address to continue.',
  'auth/user-disabled': 'This account has been disabled. Contact support to reactivate it.',
  'auth/user-not-found': "We couldn't find an account with that email. Try registering instead.",
  'auth/wrong-password': "That password doesn't match this account. Try again.",
  'auth/invalid-credential': "That email and password don't match. Try again.",
  'auth/invalid-login-credentials': "That email and password don't match. Try again.",
  'auth/email-already-in-use': 'That email is already registered. Log in instead.',
  'auth/weak-password': 'Pick a password with at least 6 characters.',
  'auth/missing-password': 'Enter your password to continue.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment before trying again.',
  'auth/network-request-failed': 'No connection. Check your network and try again.',
  'auth/operation-not-allowed': 'Email sign-in is turned off for this project.',
  'auth/google-unavailable': 'Google sign-in arrives with the shared Firebase setup. Use email for now.',
  'firebase/not-configured': 'The app is not connected to Firebase yet.',
};

export function describeAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : error instanceof Error
        ? error.message
        : '';

  return messages[code] ?? 'Something went wrong. Try again in a moment.';
}

export type AuthMode = 'login' | 'register';

export type AuthFormValues = {
  name: string;
  height: string;
  weight: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthFieldErrors = Partial<Record<keyof AuthFormValues, string>>;

export type Notice = { tone: 'warning' | 'info' | 'error'; message: string };
export type AuthConfirmation = { kind: 'verification-sent' | 'reset-sent'; email: string };
export type AuthBusy = 'email' | 'google' | 'reset' | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL.test(email.trim());
}

export function validateAuthInput(mode: AuthMode, values: AuthFormValues, units: Units = 'metric'): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (!isValidEmail(values.email)) {
    errors.email = "That email address doesn't look right.";
  }
  if (mode === 'login') {
    if (!values.password) errors.password = 'Enter your password.';
    return errors;
  }

  if (values.password.length < 6) {
    errors.password = 'Use at least 6 characters.';
  }
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  const imperial = units === 'imperial';
  const height = measureError(values.height, heightRangeFor(units), imperial ? 'Enter a height in inches' : 'Enter a height in cm');
  if (height) errors.height = height;
  const weight = measureError(values.weight, weightRangeFor(units), imperial ? 'Enter a weight in pounds' : 'Enter a weight in kg');
  if (weight) errors.weight = weight;

  return errors;
}
