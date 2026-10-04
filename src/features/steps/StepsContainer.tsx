import React from 'react';
import { StepsScreen } from './StepsScreen';
import { useStepsData } from './useStepsData';

type Props = {
  onBack: () => void;
};

export function StepsContainer({ onBack }: Props) {
  const data = useStepsData();
  return <StepsScreen {...data} onBack={onBack} />;
}
