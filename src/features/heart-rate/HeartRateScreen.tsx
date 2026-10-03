import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

type Props = {
  bottomInset: number;
};

export function HeartRateScreen({ bottomInset }: Props) {
  return (
    <PlaceholderScreen
      title="Heart Rate"
      blurb="Live BPM, the 24-hour trend and alert thresholds land here in Task 3."
      icon="heart"
      bottomInset={bottomInset}
    />
  );
}
