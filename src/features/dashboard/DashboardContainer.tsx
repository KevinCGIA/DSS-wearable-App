import React from 'react';
import type { SensorReading } from '@/data/types';
import { useActivityFocus } from '@/features/activity/ActivityFocusProvider';
import { sourceKeyOf, TEST_SOURCE } from '@/features/activity/activityModel';
import type { ActivitySection } from '@/features/activity/activityModel';
import { DashboardScreen } from './DashboardScreen';
import { useDashboardData } from './useDashboardData';

type Props = {
  displayName: string;
  bottomInset: number;
  onOpenProfile: () => void;
  onOpenDevices: () => void;
  onOpenActivity: () => void;
};

export function DashboardContainer({ displayName, onOpenActivity, ...actions }: Props) {
  const data = useDashboardData(displayName);
  const { focus } = useActivityFocus();

  // "Open in Activity ›": that section, with the card's source device selected.
  const open = (section: ActivitySection, source: string | null) => {
    focus(section, source);
    onOpenActivity();
  };
  const sourceOf = (reading: SensorReading | null) => (reading ? sourceKeyOf(reading) : null);

  return (
    <DashboardScreen
      {...data}
      {...actions}
      onOpenHeartRate={() => open('heart-rate', sourceOf(data.heartRate.reading))}
      onOpenSteps={() => open('steps', sourceOf(data.steps.reading))}
      // The only sleep today is the dev sample night (Test data).
      onOpenSleep={() => open('sleep', data.sleep ? TEST_SOURCE : null)}
    />
  );
}
