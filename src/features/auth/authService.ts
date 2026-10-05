import type { AuthService } from './authTypes';
export type { AuthService, SignInResult, SignUpInput } from './authTypes';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Browser-only preview service. Native builds resolve authService.native.ts.
const previewService: AuthService = {
  mode: 'preview',
  async signIn(email) {
    await wait(700);
    return email.toLowerCase().includes('unverified') ? 'unverified' : 'signed-in';
  },
  async signInWithGoogle() {
    await wait(700);
  },
  async signUp() {
    await wait(900);
  },
  async signUpWithGoogle() {
    await wait(700);
  },
  async sendPasswordReset() {
    await wait(700);
  },
};

export const authService = previewService;
