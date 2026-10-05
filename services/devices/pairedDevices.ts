import { Platform } from "react-native";

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
// scanning:
//
//   users/{uid}/devices/{installationId}_{deviceId}
//
// Bluetooth device IDs only work on the phone that found them (see
// installationId.ts), so each entry records the app install and platform
// it belongs to, and each phone only lists its own devices.
//
// Entries saved before this (doc ID = deviceId, no installationId) all came
// from Android phones; Android shows them and replaces them with the new
// format the next time that device connects.
//
// The auto-connect preference lives on the user's profile document
// (users/{uid}.autoConnectDevice) alongside name/height/weight.

export type PairedDevice = {
  // Firestore document ID, used to forget the device
  docId: string;
  deviceId: string;
  name: string;
  addedAt: Date | null;
  lastConnectedAt: Date | null;
};

type PairedDeviceDoc = {
  deviceId: string;
  name: string;
  installationId?: string;
  platform?: string;
  addedAt: Timestamp | null;
  lastConnectedAt: Timestamp | null;
};

function devicesCollection(uid: string) {
  return collection(getFirestore(), "users", uid, "devices");
}

function deviceDoc(uid: string, docId: string) {
  return doc(getFirestore(), "users", uid, "devices", docId);
}

function profileDoc(uid: string) {
  return doc(getFirestore(), "users", uid);
}

// This phone's paired devices, most recently connected first.
// Returns an unsubscribe function.
export function subscribeToPairedDevices(
  uid: string,
  installationId: string,
  onDevices: (devices: PairedDevice[]) => void,
  onError: (error: Error) => void
): () => void {
  // Filtered here rather than with a where() so no composite index is
  // needed; a user only ever has a handful of devices
  return onSnapshot(
    query(devicesCollection(uid), orderBy("lastConnectedAt", "desc")),
    (snapshot) => {
      onDevices(
        snapshot.docs
          .filter((d) => {
            const data = d.data() as PairedDeviceDoc;

            return data.installationId
              ? data.installationId === installationId
              : Platform.OS === "android";
          })
          .map((d) => {
            const data = d.data() as PairedDeviceDoc;

            return {
              docId: d.id,
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
  installationId: string,
  deviceId: string,
  name: string
): Promise<void> {
  const ref = deviceDoc(uid, `${installationId}_${deviceId}`);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    await updateDoc(ref, { name, lastConnectedAt: serverTimestamp() });
  } else {
    await setDoc(ref, {
      deviceId,
      name,
      installationId,
      platform: Platform.OS,
      addedAt: serverTimestamp(),
      lastConnectedAt: serverTimestamp(),
    });
  }

  // Replace an old-format entry for the same device, if there is one
  if (Platform.OS === "android") {
    const legacyRef = deviceDoc(uid, deviceId);
    const legacy = await getDoc(legacyRef);

    if (legacy.exists() && !legacy.data()?.installationId) {
      await deleteDoc(legacyRef);
    }
  }
}

export async function forgetPairedDevice(
  uid: string,
  docId: string
): Promise<void> {
  await deleteDoc(deviceDoc(uid, docId));
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
