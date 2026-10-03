import React from 'react';
import type { TabKey } from '@/navigation/routes';
import { HomeScreen } from './HomeScreen';
import { useHomeData } from './useHomeData';

type Props = {
  displayName: string;
  bottomInset: number;
  onOpenProfile: () => void;
  onOpenDevices: () => void;
  onOpenTab: (tab: TabKey) => void;
};

export function HomeContainer({ displayName, bottomInset, onOpenProfile, onOpenDevices, onOpenTab }: Props) {
  const data = useHomeData(displayName);

  return (
    <HomeScreen
      {...data}
      bottomInset={bottomInset}
      onOpenProfile={onOpenProfile}
      onOpenDevices={onOpenDevices}
      onOpenTab={onOpenTab}
    />
  );
}
