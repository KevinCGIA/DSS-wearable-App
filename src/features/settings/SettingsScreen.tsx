import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

type Props = {
  bottomInset: number;
  onSignOut: () => void;
};

export function SettingsScreen({ bottomInset, onSignOut }: Props) {
  return (
    <PlaceholderScreen
      title="Account & configuration"
      blurb="Profile, goals, and paired-device settings live here."
      icon="settings"
      bottomInset={bottomInset}
      onSignOut={onSignOut}
    />
  );
}
