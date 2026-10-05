import React from 'react';
import { ActivityScreen } from './ActivityScreen';
import { useActivityData } from './useActivityData';

type Props = {
  bottomInset: number;
};

export function ActivityContainer({ bottomInset }: Props) {
  const data = useActivityData();
  return <ActivityScreen {...data} bottomInset={bottomInset} />;
}
