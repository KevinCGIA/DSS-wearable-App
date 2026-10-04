import { Platform } from 'react-native';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  verifyBeforeUpdateEmail,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ensureNativeProfile, saveNativeAvatar } from '@/features/profile/nativeProfileWrites';
import { googleClientConfig } from './googleClientConfig';
import { authError, createNativeAuthService } from './nativeAuthFlow';

function currentUser() {
  const user = getAuth().currentUser;
  if (!user) throw authError('auth/no-current-user');
  return user;
}

let googleConfigured = false;

// Kevin's login/register handlers, isolated until the container swap in A9.
export const nativeAuthService = createNativeAuthService({
  currentUser: () => getAuth().currentUser,
  observeAuth: (listener) => onAuthStateChanged(getAuth(), listener),
  signInEmail: async (email, password) =>
    (await signInWithEmailAndPassword(getAuth(), email, password)).user,
  createUser: async (email, password) =>
    (await createUserWithEmailAndPassword(getAuth(), email, password)).user,
  async signInGoogle() {
    if (!googleConfigured) {
      GoogleSignin.configure(googleClientConfig);
      googleConfigured = true;
    }
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (response.type === 'cancelled') throw authError('auth/cancelled');
    const token = response.data.idToken;
    if (!token) throw authError('auth/invalid-credential');
    return (await signInWithCredential(getAuth(), GoogleAuthProvider.credential(token))).user;
  },
  signOut: () => signOut(getAuth()),
  updateDisplayName: (name) => updateProfile(currentUser(), { displayName: name }),
  sendVerification: () => sendEmailVerification(currentUser()),
  sendPasswordReset: (email) => sendPasswordResetEmail(getAuth(), email),
  changeEmail: (email) => verifyBeforeUpdateEmail(currentUser(), email),
  ensureProfile: ensureNativeProfile,
  saveAvatar: saveNativeAvatar,
});
