import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { UserProfile } from '@/data/types';
import { describeAuthError } from '@/features/auth/authErrors';
import { accountService } from './accountService';

// One loaded profile shared by the Settings "Profile" row and the Profile screen.
// Android: loadProfile in app/(auth)/settings.tsx; native storage is users/{uid} + private/avatarData.
type ProfileContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  update: (patch: Partial<UserProfile>, expectedUid?: string) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ displayName, children }: { displayName: string; children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);

  const reload = useCallback(async () => {
    const version = ++request.current;
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const loaded = await accountService.loadProfile(displayName);
      if (version === request.current) setProfile(loaded);
    } catch (e) {
      if (version === request.current) setError(`Failed to load profile: ${describeAuthError(e)}`);
    } finally {
      if (version === request.current) setLoading(false);
    }
  }, [displayName]);

  useEffect(() => {
    const unsubscribe = accountService.subscribeToUser?.(() => void reload());
    if (!accountService.subscribeToUser) void reload();
    return () => {
      request.current++;
      unsubscribe?.();
    };
  }, [reload]);

  const update = useCallback((patch: Partial<UserProfile>, expectedUid?: string) => {
    setProfile((prev) => (prev && (!expectedUid || prev.uid === expectedUid) ? { ...prev, ...patch } : prev));
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
