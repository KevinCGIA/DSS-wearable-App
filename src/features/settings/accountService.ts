import { sendPasswordResetEmail, updateProfile, verifyBeforeUpdateEmail } from 'firebase/auth';
import { mockProfile } from '@/data/mocks';
import type { UserProfile } from '@/data/types';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

// Mirrors loadProfile / saveProfile / changeEmail / changePassword in Android's app/(auth)/settings.tsx.
// Phase 2: profile reads/writes go to users/{uid} (+ private/avatarData) with Android's Firestore helpers.

export type ProfileUpdate = { name: string; height: number | null; weight: number | null };

export type AccountService = {
  loadProfile: (fallbackName: string) => Promise<UserProfile>;
  saveProfile: (update: ProfileUpdate) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  changePassword: () => Promise<string>;
};

function currentUser() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw Object.assign(new Error('auth/no-current-user'), { code: 'auth/no-current-user' });
  return user;
}

const firebaseService: AccountService = {
  async loadProfile(fallbackName) {
    const user = currentUser();
    return {
      uid: user.uid,
      name: user.displayName ?? fallbackName,
      email: user.email ?? '',
      emailVerified: user.emailVerified,
      height: null,
      weight: null,
      avatarData: user.photoURL,
    };
  },
  async saveProfile({ name }) {
    await updateProfile(currentUser(), { displayName: name });
  },
  async changeEmail(newEmail) {
    await verifyBeforeUpdateEmail(currentUser(), newEmail);
  },
  async changePassword() {
    const user = currentUser();
    if (!user.email) throw new Error('No email on this account.');
    await sendPasswordResetEmail(getFirebaseAuth(), user.email);
    return user.email;
  },
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let previewProfile: UserProfile | null = null;

const previewService: AccountService = {
  async loadProfile(fallbackName) {
    await wait(500);
    previewProfile = previewProfile ?? { ...mockProfile, name: fallbackName };
    return previewProfile;
  },
  async saveProfile(update) {
    await wait(800);
    previewProfile = { ...(previewProfile ?? mockProfile), ...update };
  },
  async changeEmail() {
    await wait(700);
  },
  async changePassword() {
    await wait(700);
    return previewProfile?.email ?? mockProfile.email;
  },
};

export const accountService: AccountService = isFirebaseConfigured ? firebaseService : previewService;
