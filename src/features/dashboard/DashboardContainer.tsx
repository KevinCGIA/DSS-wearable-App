import React from 'react';
import { DashboardScreen } from './DashboardScreen';
import { useDashboardData } from './useDashboardData';

type Props = {
  displayName: string;
  bottomInset: number;
  onOpenProfile: () => void;
  onOpenDevices: (deviceId?: string) => void;
  onOpenHeartRate: () => void;
  onOpenSteps: () => void;
  onOpenSleep: () => void;
};

export function DashboardContainer({ displayName, ...actions }: Props) {
  const data = useDashboardData(displayName);
  return <DashboardScreen {...data} {...actions} />;
}
