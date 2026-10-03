import React from 'react';
import { SettingsScreen } from './SettingsScreen';
import { useSettingsData } from './useSettingsData';

type Props = {
  bottomInset: number;
  displayName: string;
  signOut: () => void;
  onOpenDevices: () => void;
  onOpenAlertThresholds: () => void;
  onOpenNotifications: () => void;
  onOpenPreferences: () => void;
  onOpenPreviews?: () => void;
};

export function SettingsContainer({ displayName, signOut, ...rest }: Props) {
  const data = useSettingsData(displayName, signOut);
  return <SettingsScreen {...rest} {...data} />;
}
