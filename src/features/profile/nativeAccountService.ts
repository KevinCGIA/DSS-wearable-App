import { deleteUser, getAuth, getIdTokenResult } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from '@react-native-firebase/firestore';
import { nativeAuthService } from '@/features/auth/nativeAuthService';
import { createNativeAccountService } from './nativeAccountFlow';
import { deleteNativeUserData, eraseLocalAccountData } from './nativeAccountDeletion';
import { saveNativeAvatar } from './nativeProfileWrites';

export const nativeAccountService = createNativeAccountService({
  currentUser: () => getAuth().currentUser,
  async readProfile(uid) {
    return (await getDoc(doc(getFirestore(), 'users', uid))).data();
  },
  async readAvatar(uid) {
    return (await getDoc(doc(getFirestore(), 'users', uid, 'private', 'avatarData'))).data();
  },
  mergeProfile: (uid, fields) => setDoc(doc(getFirestore(), 'users', uid), fields, { merge: true }),
  saveAvatar: saveNativeAvatar,
  changeEmail: nativeAuthService.changeEmail,
  changePassword: nativeAuthService.changePassword,
  subscribeToUser: (listener) => nativeAuthService.subscribe(() => listener()),
  async lastSignIn() {
    const user = getAuth().currentUser;
    if (!user) return null;
    const time = Date.parse((await getIdTokenResult(user, true)).authTime);
    return Number.isFinite(time) ? time : null;
  },
  deleteData: deleteNativeUserData,
  async deleteUser() {
    const user = getAuth().currentUser;
    if (user) await deleteUser(user);
  },
  eraseLocal: eraseLocalAccountData,
});
