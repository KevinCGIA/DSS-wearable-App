import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

// Mirrors the handlers in Android's app/login.tsx and app/register.tsx.
// Phase 2: replace with the Android team's @react-native-firebase versions.

export type SignInResult = 'signed-in' | 'unverified';

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  height: number | null;
  weight: number | null;
  avatarUri: string | null;
};

export type AuthService = {
  mode: 'firebase' | 'preview';
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signInWithGoogle: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signUpWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
};

function codedError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code });
}

const firebaseService: AuthService = {
  mode: 'firebase',
  async signIn(email, password) {
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (!credential.user.emailVerified) {
      await signOut(auth);
      return 'unverified';
    }
    return 'signed-in';
  },
  async signInWithGoogle() {
    throw codedError('auth/google-unavailable');
  },
  async signUp({ name, email, password }) {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(credential.user, { displayName: name });
    // Height, weight and avatar go to users/{uid} via Android's Firestore helpers in Phase 2.
    await sendEmailVerification(credential.user);
    await signOut(auth);
  },
  async signUpWithGoogle() {
    throw codedError('auth/google-unavailable');
  },
  async sendPasswordReset(email) {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  },
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// No Firebase keys: simulate the flows so every state can be clicked through.
// An email containing "unverified" behaves like an account that hasn't verified yet.
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

export const authService: AuthService = isFirebaseConfigured ? firebaseService : previewService;
