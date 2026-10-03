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
  'firebase/not-configured': 'The app is not connected to Firebase yet. Add your project keys to .env.',
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

export function validateAuthInput(
  mode: 'login' | 'register',
  values: { name: string; email: string; password: string },
): Partial<Record<'name' | 'email' | 'password', string>> {
  const errors: Partial<Record<'name' | 'email' | 'password', string>> = {};

  if (mode === 'register' && values.name.trim().length < 2) {
    errors.name = 'Tell us what to call you.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "That email address doesn't look right.";
  }
  if (values.password.length < 6) {
    errors.password = 'Use at least 6 characters.';
  }

  return errors;
}
