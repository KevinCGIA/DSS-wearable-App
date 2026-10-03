import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

type Props = {
  onBack: () => void;
};

export function AlertThresholdsScreen({ onBack }: Props) {
  return (
    <PlaceholderScreen
      title="Alert Thresholds"
      blurb="Minimum and maximum heart rate alerts. Built in Task 3."
      icon="bell"
      onBack={onBack}
    />
  );
}
