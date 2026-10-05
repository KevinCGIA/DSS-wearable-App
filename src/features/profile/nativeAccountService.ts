import { getAuth } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from '@react-native-firebase/firestore';
import { nativeAuthService } from '@/features/auth/nativeAuthService';
import { createNativeAccountService } from './nativeAccountFlow';
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
});
