import React from 'react';
import { HeartRateScreen } from './HeartRateScreen';
import { useHeartRateData } from './useHeartRateData';

type Props = {
  bottomInset: number;
  onOpenAlertThresholds: () => void;
};

export function HeartRateContainer({ bottomInset, onOpenAlertThresholds }: Props) {
  const data = useHeartRateData();
  return <HeartRateScreen {...data} bottomInset={bottomInset} onOpenAlertThresholds={onOpenAlertThresholds} />;
}
