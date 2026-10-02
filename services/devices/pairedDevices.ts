import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "@react-native-firebase/firestore";

// Devices the user has connected to before, so they can reconnect without
// scanning. Stored per user so they follow the account to a new phone:
//
//   users/{uid}/devices/{deviceId}
//
// The auto-connect preference lives on the user's profile document
// (users/{uid}.autoConnectDevice) alongside name/height/weight.

export type PairedDevice = {
  deviceId: string;
  name: string;
  addedAt: Date | null;
  lastConnectedAt: Date | null;
};

type PairedDeviceDoc = {
  deviceId: string;
  name: string;
  addedAt: Timestamp | null;
  lastConnectedAt: Timestamp | null;
};

function devicesCollection(uid: string) {
  return collection(getFirestore(), "users", uid, "devices");
}

function deviceDoc(uid: string, deviceId: string) {
  return doc(getFirestore(), "users", uid, "devices", deviceId);
}

function profileDoc(uid: string) {
  return doc(getFirestore(), "users", uid);
}

// Most recently connected first. Returns an unsubscribe function.
export function subscribeToPairedDevices(
  uid: string,
  onDevices: (devices: PairedDevice[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    query(devicesCollection(uid), orderBy("lastConnectedAt", "desc")),
    (snapshot) => {
      onDevices(
        snapshot.docs.map((d) => {
          const data = d.data() as PairedDeviceDoc;

          return {
            deviceId: data.deviceId,
            name: data.name,
            addedAt: data.addedAt?.toDate() ?? null,
            lastConnectedAt: data.lastConnectedAt?.toDate() ?? null,
          };
        })
      );
    },
    onError
  );
}

// Called after every successful connection. Adds the device the first time,
// afterwards just updates its name and last-connected time.
export async function savePairedDevice(
  uid: string,
  deviceId: string,
  name: string
): Promise<void> {
  const ref = deviceDoc(uid, deviceId);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    await updateDoc(ref, { name, lastConnectedAt: serverTimestamp() });
    return;
  }

  await setDoc(ref, {
    deviceId,
    name,
    addedAt: serverTimestamp(),
    lastConnectedAt: serverTimestamp(),
  });
}

export async function forgetPairedDevice(
  uid: string,
  deviceId: string
): Promise<void> {
  await deleteDoc(deviceDoc(uid, deviceId));
}

// Defaults to on when the user has never changed it.
// Returns an unsubscribe function.
export function subscribeToAutoConnect(
  uid: string,
  onValue: (enabled: boolean) => void
): () => void {
  return onSnapshot(
    profileDoc(uid),
    (snapshot) => {
      onValue(snapshot.data()?.autoConnectDevice !== false);
    },
    () => onValue(true)
  );
}

export async function setAutoConnect(
  uid: string,
  enabled: boolean
): Promise<void> {
  await setDoc(
    profileDoc(uid),
    { autoConnectDevice: enabled },
    { merge: true }
  );
}
