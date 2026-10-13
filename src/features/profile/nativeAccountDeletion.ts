import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  deleteDoc,
  doc,
  getDocsFromServer,
  getFirestore,
  limit,
  query,
  writeBatch,
  type CollectionReference,
} from '@react-native-firebase/firestore';
import { SENSOR_TYPES } from '@/lib/biometrics/metrics';

const PAGE = 300;

// always read from the server, never the cache
async function deleteCollection(reference: CollectionReference) {
  for (;;) {
    const snapshot = await getDocsFromServer(query(reference, limit(PAGE)));
    if (snapshot.empty) return;
    const batch = writeBatch(getFirestore());
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
    if (snapshot.size < PAGE) return;
  }
}

// Subcollections aren't deleted with their parent, so empty each one. Readings go last so
// an upload already in flight has landed.
export async function deleteNativeUserData(uid: string): Promise<void> {
  const db = getFirestore();
  const user = doc(db, 'users', uid);
  for (const name of ['private', 'settings', 'devices']) await deleteCollection(collection(user, name));
  for (const type of SENSOR_TYPES) await deleteCollection(collection(user, 'sensor_readings', type, 'readings'));
  await deleteCollection(collection(user, 'reading_batches'));
  await deleteDoc(user);
}

// the stores save once more on sign-out, so clear again a moment later
export function eraseLocalAccountData(uid: string): void {
  const keys = [`dss:reading-queue:v1:${uid}`, `dss:alert-history:v1:${uid}`, `dss:connection-log:v1:${uid}`];
  const erase = () => { void AsyncStorage.multiRemove(keys).catch(() => undefined); };
  erase();
  setTimeout(erase, 3000);
}
