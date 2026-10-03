import React from 'react';
import { AlertThresholdsScreen } from './AlertThresholdsScreen';
import { useAlertThresholds } from './useAlertThresholds';

type Props = {
  onBack: () => void;
};

export function AlertThresholdsContainer({ onBack }: Props) {
  const data = useAlertThresholds(onBack);
  return <AlertThresholdsScreen {...data} />;
}
