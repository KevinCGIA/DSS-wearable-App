import type { UserProfile } from '@/data/types';

export type ProfileUpdate = { name: string; height: number | null; weight: number | null };

export type AccountService = {
  loadProfile: (fallbackName: string) => Promise<UserProfile>;
  saveProfile: (update: ProfileUpdate) => Promise<void>;
  saveProfilePicture: (uri: string) => Promise<string | void>;
  changeEmail: (newEmail: string) => Promise<void>;
  changePassword: () => Promise<string>;
  // deletes the user's data, then the account
  deleteAccount: () => Promise<void>;
  subscribeToUser?: (listener: () => void) => () => void;
};
