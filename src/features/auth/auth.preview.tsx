import React from 'react';
import type { PreviewEntry } from '@/features/previews/types';
import { AuthScreen } from './AuthScreen';
import type { AuthScreenProps } from './AuthScreen';

const noop = () => undefined;

const base: AuthScreenProps = {
  mode: 'login',
  values: { name: '', height: '', weight: '', email: '', password: '', confirmPassword: '' },
  avatarUri: null,
  fieldErrors: {},
  formError: null,
  notice: null,
  confirmation: null,
  busy: null,
  previewMode: false,
  onChangeMode: noop,
  onChangeValue: noop,
  onSignIn: noop,
  onSignInWithGoogle: noop,
  onSignUp: noop,
  onSignUpWithGoogle: noop,
  onSendPasswordReset: noop,
  onChooseProfilePicture: noop,
  onDismissConfirmation: noop,
};

const filledRegister = {
  name: 'Tarun Balaji',
  height: '178',
  weight: '72',
  email: 'tarun@example.com',
  password: 'secret1',
  confirmPassword: 'secret2',
};

export const authPreview: PreviewEntry = {
  title: 'Auth',
  group: 'Screens',
  states: [
    { label: 'Log in', render: () => <AuthScreen {...base} /> },
    {
      label: 'Logging in',
      render: () => (
        <AuthScreen {...base} values={{ ...base.values, email: 'tarun@example.com', password: 'secret1' }} busy="email" />
      ),
    },
    {
      label: 'Verify email',
      render: () => (
        <AuthScreen
          {...base}
          values={{ ...base.values, email: 'tarun@example.com', password: 'secret1' }}
          notice={{ tone: 'warning', message: 'Please verify your email before signing in.' }}
        />
      ),
    },
    {
      label: 'Log in error',
      render: () => (
        <AuthScreen
          {...base}
          values={{ ...base.values, email: 'tarun@', password: '' }}
          fieldErrors={{ email: "That email address doesn't look right.", password: 'Enter your password.' }}
          formError="That email and password don't match. Try again."
        />
      ),
    },
    { label: 'Register', render: () => <AuthScreen {...base} mode="register" /> },
    {
      label: 'Register errors',
      render: () => (
        <AuthScreen
          {...base}
          mode="register"
          values={{ ...filledRegister, height: '17' }}
          fieldErrors={{
            height: 'Enter a height in cm between 50 and 250.',
            confirmPassword: 'Passwords do not match.',
          }}
        />
      ),
    },
    {
      label: 'Verification sent',
      render: () => (
        <AuthScreen {...base} confirmation={{ kind: 'verification-sent', email: 'tarun@example.com' }} />
      ),
    },
    {
      label: 'Reset sent',
      render: () => <AuthScreen {...base} confirmation={{ kind: 'reset-sent', email: 'tarun@example.com' }} />,
    },
    { label: 'Preview mode', render: () => <AuthScreen {...base} previewMode onPreview={noop} /> },
  ],
};
