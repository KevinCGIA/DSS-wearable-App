import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { UserProfile } from '@/data/types';
import { describeAuthError } from '@/features/auth/authErrors';
import { accountService } from './accountService';

// One loaded profile shared by the Settings "Profile" row and the Profile screen.
// Android: loadProfile in app/(auth)/settings.tsx. Phase 2: users/{uid} + private/avatarData.
type ProfileContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  update: (patch: Partial<UserProfile>) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ displayName, children }: { displayName: string; children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await accountService.loadProfile(displayName));
    } catch (e) {
      setError(`Failed to load profile: ${describeAuthError(e)}`);
    } finally {
      setLoading(false);
    }
  }, [displayName]);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({ profile, loading, error, reload: () => void reload(), update }),
    [profile, loading, error, reload, update],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used inside ProfileProvider');
  return context;
}
