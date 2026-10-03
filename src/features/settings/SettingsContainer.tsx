import React from 'react';
import { SettingsScreen } from './SettingsScreen';
import { useSettingsData } from './useSettingsData';

type Props = {
  bottomInset: number;
  signOut: () => void;
  onOpenProfile: () => void;
  onOpenDevices: () => void;
  onOpenAlertThresholds: () => void;
  onOpenNotifications: () => void;
  onOpenPreferences: () => void;
  onOpenPreviews?: () => void;
};

export function SettingsContainer({ signOut, ...rest }: Props) {
  const data = useSettingsData(signOut);
  return <SettingsScreen {...rest} {...data} />;
}
