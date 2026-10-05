import { useEffect, useState } from 'react';
import { nativeAuthService } from './nativeAuthService';
import type { NativeSessionUser } from './nativeAuthFlow';
import type { AuthSession } from './authSessionTypes';
import { displayNameFor } from './authSessionModel';
import { subscribeWithDeadline } from '@/lib/asyncDeadline';

export function useAuthSession(): AuthSession {
  const [user, setUser] = useState<NativeSessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [previewName, setPreviewName] = useState<string | null>(null);

  useEffect(
    () => subscribeWithDeadline<NativeSessionUser | null>((onData) => nativeAuthService.subscribe(onData), (next) => {
      setUser(next);
      setReady(true);
    }, () => setReady(true)),
    [],
  );

  return {
    ready,
    signedIn: Boolean(user ?? previewName),
    displayName: user ? displayNameFor(user) : previewName ?? 'Researcher',
    enablePreview: __DEV__ ? setPreviewName : undefined,
    signOut: () => {
      setPreviewName(null);
      if (user) nativeAuthService.signOut().catch(() => undefined);
    },
  };
}
