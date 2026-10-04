import React from 'react';
import { HeartRateScreen } from './HeartRateScreen';
import { useHeartRateData } from './useHeartRateData';

type Props = {
  onBack: () => void;
  onOpenAlertThresholds: () => void;
};

export function HeartRateContainer({ onBack, onOpenAlertThresholds }: Props) {
  const data = useHeartRateData();
  return <HeartRateScreen {...data} onBack={onBack} onOpenAlertThresholds={onOpenAlertThresholds} />;
}
