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
