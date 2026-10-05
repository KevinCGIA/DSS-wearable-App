import { mockProfile } from '@/data/mocks';
import type { UserProfile } from '@/data/types';
import type { AccountService } from './accountTypes';
export type { AccountService, ProfileUpdate } from './accountTypes';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let previewProfile: UserProfile | null = null;

// Browser-only preview service. Native builds resolve accountService.native.ts.
export const accountService: AccountService = {
  async loadProfile(fallbackName) {
    await wait(500);
    previewProfile = previewProfile ?? { ...mockProfile, name: fallbackName };
    return previewProfile;
  },
  async saveProfile(update) {
    await wait(800);
    previewProfile = { ...(previewProfile ?? mockProfile), ...update };
  },
  async saveProfilePicture(uri) {
    await wait(400);
    previewProfile = { ...(previewProfile ?? mockProfile), avatarData: uri };
    return uri;
  },
  async changeEmail() {
    await wait(700);
  },
  async changePassword() {
    await wait(700);
    return previewProfile?.email ?? mockProfile.email;
  },
};
