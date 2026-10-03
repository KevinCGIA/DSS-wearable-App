import React from 'react';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

type Props = {
  bottomInset: number;
};

export function MonitoringScreen({ bottomInset }: Props) {
  return (
    <PlaceholderScreen
      title="Real-time monitoring"
      blurb="Live BLE streams from the paired band land here once device connectivity is wired up."
      icon="activity"
      bottomInset={bottomInset}
    />
  );
}
