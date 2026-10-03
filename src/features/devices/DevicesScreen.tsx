import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

type Props = {
  onBack: () => void;
};

export function DevicesScreen({ onBack }: Props) {
  return (
    <PlaceholderScreen
      title="Devices"
      blurb="Scan, connect and manage paired devices. Built in Task 3."
      icon="bluetooth"
      onBack={onBack}
    />
  );
}
