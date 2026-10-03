import React from 'react';
import { FitnessScreen } from './FitnessScreen';
import { useFitnessData } from './useFitnessData';

type Props = {
  bottomInset: number;
};

export function FitnessContainer({ bottomInset }: Props) {
  const data = useFitnessData();
  return <FitnessScreen {...data} bottomInset={bottomInset} />;
}
