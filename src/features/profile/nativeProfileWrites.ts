import { doc, getFirestore, runTransaction, setDoc } from '@react-native-firebase/firestore';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { RegistrationProfile } from '@/features/auth/nativeAuthFlow';

// app/register.tsx: signUp/signUpWithGoogle. Existing profiles are never replaced.
export async function ensureNativeProfile(uid: string, profile: RegistrationProfile): Promise<void> {
  const firestore = getFirestore();
  const reference = doc(firestore, 'users', uid);
  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) transaction.set(reference, profile);
  });
}

// app/register.tsx and app/(auth)/settings.tsx: avatar serialization and storage.
export async function saveNativeAvatar(uid: string, uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  try {
    const image = await context.resize({ width: 300, height: 300 }).renderAsync();
    try {
      const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.5, base64: true });
      if (!result.base64) throw new Error('Avatar encoding failed.');
      const imageData = `data:image/jpeg;base64,${result.base64}`;
      await setDoc(doc(getFirestore(), 'users', uid, 'private', 'avatarData'), { imageData }, { merge: true });
      return imageData;
    } finally {
      image.release();
    }
  } finally {
    context.release();
  }
}
