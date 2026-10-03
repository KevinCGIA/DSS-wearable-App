import React from 'react';
import { ProfileScreen } from './ProfileScreen';
import { useProfileData } from './useProfileData';

type Props = {
  onBack: () => void;
};

export function ProfileContainer({ onBack }: Props) {
  const data = useProfileData();
  return <ProfileScreen {...data} onBack={onBack} />;
}
