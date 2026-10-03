import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

type Props = {
  bottomInset: number;
};

export function FitnessScreen({ bottomInset }: Props) {
  return (
    <PlaceholderScreen
      title="Fitness"
      blurb="Steps today against your goal and the 24-hour steps chart land here in Task 3."
      icon="activity"
      bottomInset={bottomInset}
    />
  );
}
