import type { NativeSessionUser } from '@/features/auth/nativeAuthFlow';
import type { AccountService } from './accountTypes';

type ProfileDocument = Record<string, unknown> | undefined;

export type AccountDependencies = {
  currentUser: () => NativeSessionUser | null;
  readProfile: (uid: string) => Promise<ProfileDocument>;
  readAvatar: (uid: string) => Promise<ProfileDocument>;
  mergeProfile: (uid: string, fields: { name: string; height: string; weight: string }) => Promise<void>;
  saveAvatar: (uid: string, uri: string) => Promise<string>;
  changeEmail: (email: string) => Promise<void>;
  changePassword: () => Promise<string>;
  subscribeToUser: (listener: () => void) => () => void;
};

function error(code: string) {
  return Object.assign(new Error(code), { code });
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function measurement(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function createNativeAccountService(deps: AccountDependencies): AccountService {
  const user = () => {
    const current = deps.currentUser();
    if (!current) throw error('auth/no-current-user');
    return current;
  };
  const assertUser = (uid: string) => {
    if (deps.currentUser()?.uid !== uid) throw error('auth/user-mismatch');
  };

  return {
    async loadProfile(fallbackName) {
      const current = user();
      const [profile, avatar] = await Promise.all([
        deps.readProfile(current.uid), deps.readAvatar(current.uid),
      ]);
      assertUser(current.uid);
      return {
        uid: current.uid,
        name: text(profile?.name) ?? text(current.displayName) ?? text(fallbackName) ??
          current.email?.split('@')[0] ?? '',
        email: current.email ?? '',
        emailVerified: current.emailVerified,
        height: measurement(profile?.height),
        weight: measurement(profile?.weight),
        avatarData: text(avatar?.imageData) ?? text(profile?.profilePictureUrl) ?? text(current.photoURL),
      };
    },
    async saveProfile(update) {
      const current = user();
      for (const value of [update.height, update.weight]) {
        if (value !== null && (!Number.isFinite(value) || value <= 0)) {
          throw error('profile/invalid-measurement');
        }
      }
      await deps.mergeProfile(current.uid, {
        name: update.name.trim(),
        height: update.height === null ? '' : String(update.height),
        weight: update.weight === null ? '' : String(update.weight),
      });
      assertUser(current.uid);
    },
    async saveProfilePicture(uri) {
      const current = user();
      const data = await deps.saveAvatar(current.uid, uri);
      assertUser(current.uid);
      return data;
    },
    changeEmail: deps.changeEmail,
    changePassword: deps.changePassword,
    subscribeToUser: deps.subscribeToUser,
  };
}
