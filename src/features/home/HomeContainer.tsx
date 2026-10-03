import React from 'react';
import type { TabKey } from '@/navigation/routes';
import { HomeScreen } from './HomeScreen';
import { useHomeData } from './useHomeData';

type Props = {
  displayName: string;
  bottomInset: number;
  onOpenSettings: () => void;
  onOpenDevices: () => void;
  onOpenTab: (tab: TabKey) => void;
};

export function HomeContainer({ displayName, bottomInset, onOpenSettings, onOpenDevices, onOpenTab }: Props) {
  const data = useHomeData(displayName);

  return (
    <HomeScreen
      {...data}
      bottomInset={bottomInset}
      onOpenSettings={onOpenSettings}
      onOpenDevices={onOpenDevices}
      onOpenTab={onOpenTab}
    />
  );
}
