import React from 'react';
import { NotificationsScreen } from './NotificationsScreen';
import { useNotifications } from './useNotifications';

type Props = {
  onBack: () => void;
  onOpenAlertThresholds: () => void;
};

export function NotificationsContainer({ onBack, onOpenAlertThresholds }: Props) {
  const data = useNotifications();
  return <NotificationsScreen {...data} onBack={onBack} onOpenAlertThresholds={onOpenAlertThresholds} />;
}
