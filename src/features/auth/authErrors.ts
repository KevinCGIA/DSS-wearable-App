import { heightRangeFor, measureError, weightRangeFor } from '@/lib/measures';
import type { Units } from '@/lib/measures';

const messages: Record<string, string> = {
  'auth/invalid-email': "That email address doesn't look right. Check it and try again.",
  'auth/missing-email': 'Enter your email address to continue.',
  'auth/user-disabled': 'This account has been disabled. Contact support to reactivate it.',
  // same message for a wrong email and a wrong password
  'auth/user-not-found': "That email and password don't match. Try again.",
  'auth/wrong-password': "That email and password don't match. Try again.",
  'auth/invalid-credential': "That email and password don't match. Try again.",
  'auth/invalid-login-credentials': "That email and password don't match. Try again.",
  'auth/email-already-in-use': 'That email is already registered. Log in instead.',
  'auth/weak-password': 'Pick a password with at least 8 characters, including a letter and a number.',
  'auth/requires-recent-login': 'For your security, log out, log in again, then try this within a few minutes.',
  'account/preview': "This isn't available in preview mode.",
  'auth/missing-password': 'Enter your password to continue.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment before trying again.',
  'auth/network-request-failed': 'No connection. Check your network and try again.',
  'auth/operation-not-allowed': 'Email sign-in is turned off for this project.',
  'auth/google-unavailable': 'Google sign-in arrives with the shared Firebase setup. Use email for now.',
  'firebase/not-configured': 'The app is not connected to Firebase yet.',
  'firestore/unavailable': 'No connection. Check your network and try again.',
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

export const MIN_PASSWORD_LENGTH = 8;

// new passwords only; existing accounts are unaffected
export function passwordError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Include at least one letter and one number.';
  return null;
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

  const password = passwordError(values.password);
  if (password) errors.password = password;
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
