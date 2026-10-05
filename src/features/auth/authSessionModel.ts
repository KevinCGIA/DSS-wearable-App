import type { NativeSessionUser } from './nativeAuthFlow';

export function displayNameFor(user: NativeSessionUser | null): string {
  const displayName = user?.displayName?.trim().split(/\s+/)[0];
  if (displayName) return displayName;
  const emailName = user?.email?.trim().split('@')[0];
  return emailName || 'Researcher';
}
