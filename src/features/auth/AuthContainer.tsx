import React from 'react';
import { AuthScreen } from './AuthScreen';
import { useAuthForm } from './useAuthForm';

type Props = {
  onPreview?: (displayName: string) => void;
};

export function AuthContainer({ onPreview }: Props) {
  const form = useAuthForm({ onPreview });
  return <AuthScreen {...form} />;
}
