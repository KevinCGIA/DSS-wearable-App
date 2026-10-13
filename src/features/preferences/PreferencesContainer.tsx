import React from 'react';
import { PreferencesScreen } from './PreferencesScreen';
import { usePreferencesForm } from './usePreferencesForm';

type Props = {
  onBack: () => void;
};

export function PreferencesContainer({ onBack }: Props) {
  const data = usePreferencesForm(onBack);
  return <PreferencesScreen {...data} />;
}
