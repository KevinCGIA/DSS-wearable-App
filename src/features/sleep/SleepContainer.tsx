import React from 'react';
import { SleepScreen } from './SleepScreen';
import { useSleepData } from './useSleepData';

type Props = {
  onBack: () => void;
};

export function SleepContainer({ onBack }: Props) {
  const data = useSleepData();
  return <SleepScreen {...data} onBack={onBack} />;
}
