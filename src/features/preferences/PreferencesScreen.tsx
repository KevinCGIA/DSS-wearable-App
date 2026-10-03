import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

type Props = {
  onBack: () => void;
};

export function PreferencesScreen({ onBack }: Props) {
  return (
    <PlaceholderScreen
      title="Preferences"
      blurb="Text size, units and notifications. Built last if time allows."
      icon="sliders"
      onBack={onBack}
    />
  );
}
