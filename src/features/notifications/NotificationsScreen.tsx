import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

type Props = {
  onBack: () => void;
};

export function NotificationsScreen({ onBack }: Props) {
  return (
    <PlaceholderScreen
      title="Notifications"
      blurb="Heart rate alerts grouped by day. Built in Task 3."
      icon="inbox"
      onBack={onBack}
    />
  );
}
