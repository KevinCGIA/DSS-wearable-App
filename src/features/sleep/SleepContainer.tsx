import React from 'react';
import { SleepScreen } from './SleepScreen';
import { useSleepData } from './useSleepData';

type Props = {
  bottomInset: number;
};

export function SleepContainer({ bottomInset }: Props) {
  const data = useSleepData();
  return <SleepScreen {...data} bottomInset={bottomInset} />;
}
