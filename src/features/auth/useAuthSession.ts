import { useState } from 'react';
import type { AuthSession } from './authSessionTypes';
export type { AuthSession } from './authSessionTypes';

// Browser preview only. Native builds resolve useAuthSession.native.ts.
export function useAuthSession(): AuthSession {
  const [previewName, setPreviewName] = useState<string | null>(null);
  return {
    ready: true,
    signedIn: previewName !== null,
    displayName: previewName ?? 'Researcher',
    enablePreview: __DEV__ ? setPreviewName : undefined,
    signOut: () => setPreviewName(null),
  };
}
