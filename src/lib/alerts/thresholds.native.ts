import { getAuth } from '@react-native-firebase/auth';
import {
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import { createNativeThresholdStore } from './nativeThresholdStore';
export {
  DEFAULT_ALERT_THRESHOLDS,
  HR_MAX_RANGE,
  HR_MIN_GAP,
  HR_MIN_RANGE,
  thresholdsFromDocument,
  validateThresholds,
} from './thresholdsCore';

const store = createNativeThresholdStore({
  currentUid: () => getAuth().currentUser?.uid ?? null,
  subscribeDocument(uid, onData, onError) {
    return onSnapshot(
      doc(getFirestore(), 'users', uid, 'settings', 'alerts'),
      (snapshot) => onData(snapshot.data()),
      onError,
    );
  },
  writeDocument: (uid, data) =>
    setDoc(doc(getFirestore(), 'users', uid, 'settings', 'alerts'), data, { merge: true }),
  serverTimestamp,
});

export const getAlertThresholdsUid = store.getUid;
export const subscribeToAlertThresholds = store.subscribe;
export const saveAlertThresholds = store.save;
