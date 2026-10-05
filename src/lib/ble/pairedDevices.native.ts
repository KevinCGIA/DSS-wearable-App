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
  platform?: "ios" | "android";
  localName?: string;
  serviceUUIDs?: string[];
  lastRssi?: number | null;
  lastBattery?: number | null;
  modelNumber?: string | null;
  firmwareRevision?: string | null;
};

type PairedDeviceDoc = {
  deviceId: string;
  name: string;
  addedAt: Timestamp | null;
  lastConnectedAt: Timestamp | null;
  platform?: "ios" | "android";
  localName?: string;
  serviceUUIDs?: string[];
  lastRssi?: number | null;
  lastBattery?: number | null;
  modelNumber?: string | null;
  firmwareRevision?: string | null;
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
            platform: data.platform,
            localName: data.localName,
            serviceUUIDs: data.serviceUUIDs,
            lastRssi: data.lastRssi,
            lastBattery: data.lastBattery,
            modelNumber: data.modelNumber,
            firmwareRevision: data.firmwareRevision,
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
  name: string,
  metadata: { platform: "ios" | "android"; localName?: string; serviceUUIDs?: string[]; lastRssi?: number; lastBattery?: number; modelNumber?: string; firmwareRevision?: string; updateConnectionTime?: boolean }
): Promise<void> {
  const ref = deviceDoc(uid, deviceId);
  const existing = await getDoc(ref);
  const hints = {
    platform: metadata.platform,
    ...(metadata.localName ? { localName: metadata.localName } : {}),
    ...(metadata.serviceUUIDs?.length ? { serviceUUIDs: metadata.serviceUUIDs } : {}),
    ...(typeof metadata.lastRssi === 'number' ? { lastRssi: metadata.lastRssi } : {}),
    ...(typeof metadata.lastBattery === 'number' ? { lastBattery: metadata.lastBattery } : {}),
    ...(metadata.modelNumber ? { modelNumber: metadata.modelNumber } : {}),
    ...(metadata.firmwareRevision ? { firmwareRevision: metadata.firmwareRevision } : {}),
  };

  if (existing.exists()) {
    await updateDoc(ref, { name, ...(metadata.updateConnectionTime !== false ? { lastConnectedAt: serverTimestamp() } : {}), ...hints });
    return;
  }

  await setDoc(ref, {
    deviceId,
    name,
    addedAt: serverTimestamp(),
    lastConnectedAt: serverTimestamp(),
    ...hints,
  }, { merge: true });
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
  onValue: (enabled: boolean) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    profileDoc(uid),
    (snapshot) => {
      onValue(snapshot.data()?.autoConnectDevice !== false);
    },
    onError
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
