import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

export type AuthSession = {
  /** False until the first auth state callback has landed. */
  ready: boolean;
  signedIn: boolean;
  displayName: string;
  /** Only set when Firebase keys are missing, so the UI can offer a local preview. */
  enablePreview: ((displayName: string) => void) | undefined;
  signOut: () => void;
};

export function useAuthSession(): AuthSession {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isFirebaseConfigured);
  const [previewName, setPreviewName] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(getFirebaseAuth(), (next) => {
      setUser(next);
      setReady(true);
    });
  }, []);

  return {
    ready,
    signedIn: Boolean(user ?? previewName),
    displayName: user?.displayName?.split(' ')[0] ?? previewName ?? 'Athlete',
    enablePreview: isFirebaseConfigured ? undefined : setPreviewName,
    signOut: () => {
      setPreviewName(null);
      if (isFirebaseConfigured) {
        firebaseSignOut(getFirebaseAuth()).catch(() => undefined);
      }
    },
  };
}
