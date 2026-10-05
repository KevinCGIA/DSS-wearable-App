import type { AuthService, SignUpInput } from './authTypes';

export type NativeSessionUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  providerData: { providerId: string }[];
};

export type RegistrationProfile = {
  name: string;
  height: string;
  weight: string;
  profilePictureUrl?: string;
};

export type AuthDependencies = {
  currentUser: () => NativeSessionUser | null;
  observeAuth: (listener: (user: NativeSessionUser | null) => void) => () => void;
  signInEmail: (email: string, password: string) => Promise<NativeSessionUser>;
  createUser: (email: string, password: string) => Promise<NativeSessionUser>;
  signInGoogle: () => Promise<NativeSessionUser>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  changeEmail: (email: string) => Promise<void>;
  ensureProfile: (uid: string, profile: RegistrationProfile) => Promise<void>;
  saveAvatar: (uid: string, uri: string) => Promise<void>;
};

export type NativeAuthService = AuthService & {
  subscribe: (listener: (user: NativeSessionUser | null) => void) => () => void;
  signOut: () => Promise<void>;
  changeEmail: (email: string) => Promise<void>;
  changePassword: () => Promise<string>;
};

export function authError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code });
}

function sessionUser(user: NativeSessionUser | null): NativeSessionUser | null {
  const passwordUser = user?.providerData.some(({ providerId }) => providerId === 'password');
  return passwordUser && !user?.emailVerified ? null : user;
}

export function createNativeAuthService(deps: AuthDependencies): NativeAuthService {
  let busy = false;
  let rejectedUid: string | null = null;
  const listeners = new Set<(user: NativeSessionUser | null) => void>();
  let unsubscribe: (() => void) | undefined;

  const acceptedUser = (user: NativeSessionUser | null) =>
    user?.uid === rejectedUid ? null : sessionUser(user);
  const publish = (user: NativeSessionUser | null) => {
    if (!busy) listeners.forEach((listener) => listener(acceptedUser(user)));
  };

  // Firebase emits a user before registration/profile setup has finished.
  const authenticate = async <T>(action: () => Promise<T>): Promise<T> => {
    if (busy) throw authError('auth/operation-in-progress');
    busy = true;
    try {
      const result = await action();
      rejectedUid = null;
      return result;
    } catch (error) {
      rejectedUid = deps.currentUser()?.uid ?? null;
      throw error;
    } finally {
      busy = false;
      publish(deps.currentUser());
    }
  };

  const google = () => authenticate(async () => {
    const user = await deps.signInGoogle();
    try {
      await deps.ensureProfile(user.uid, {
        name: user.displayName?.trim().split(/\s+/)[0] ?? '',
        height: '',
        weight: '',
        profilePictureUrl: user.photoURL ?? '',
      });
    } catch (error) {
      await deps.signOut();
      throw error;
    }
  });

  return {
    mode: 'firebase',
    signIn: (email, password) => authenticate(async () => {
      const user = await deps.signInEmail(email.trim(), password);
      if (!user.emailVerified) {
        await deps.signOut();
        return 'unverified';
      }
      return 'signed-in';
    }),
    signInWithGoogle: google,
    signUpWithGoogle: google,
    signUp: (input: SignUpInput) => authenticate(async () => {
      const user = await deps.createUser(input.email.trim(), input.password);
      try {
        await deps.ensureProfile(user.uid, {
          name: input.name.trim(),
          height: input.height === null ? '' : String(input.height),
          weight: input.weight === null ? '' : String(input.weight),
        });
        if (input.name.trim()) await deps.updateDisplayName(input.name.trim());
        if (input.avatarUri) await deps.saveAvatar(user.uid, input.avatarUri);
        await deps.sendVerification();
      } finally {
        await deps.signOut();
      }
    }),
    sendPasswordReset: (email) => deps.sendPasswordReset(email.trim()),
    changeEmail: (email) => {
      if (!deps.currentUser()) return Promise.reject(authError('auth/no-current-user'));
      if (!email.trim()) return Promise.reject(authError('auth/missing-email'));
      return deps.changeEmail(email.trim());
    },
    async changePassword() {
      const user = deps.currentUser();
      if (!user) throw authError('auth/no-current-user');
      if (!user.email) throw authError('auth/missing-email');
      await deps.sendPasswordReset(user.email);
      return user.email;
    },
    signOut: () => authenticate(deps.signOut),
    subscribe(listener) {
      listeners.add(listener);
      if (!unsubscribe) {
        unsubscribe = deps.observeAuth(publish);
      } else if (!busy) {
        listener(acceptedUser(deps.currentUser()));
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          unsubscribe?.();
          unsubscribe = undefined;
        }
      };
    },
  };
}
