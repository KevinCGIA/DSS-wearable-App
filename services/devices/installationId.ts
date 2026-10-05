import * as FileSystem from "expo-file-system/legacy";

// A random ID for this install of the app, kept in the app's own files.
//
// Paired devices need it because Bluetooth device IDs are only meaningful on
// the phone that found them: Android uses the device's hardware address, but
// iOS gives each device a random ID that is different on every iPhone. So
// each saved device records which install it belongs to.
//
// Reinstalling the app creates a new ID, after which devices need pairing
// again (the same as what Android/iOS themselves require).

const FILE = `${FileSystem.documentDirectory}installation-id.txt`;

let cached: Promise<string> | null = null;

export function getInstallationId(): Promise<string> {
  if (!cached) {
    cached = loadOrCreate();
  }

  return cached;
}

async function loadOrCreate(): Promise<string> {
  try {
    const existing = (await FileSystem.readAsStringAsync(FILE)).trim();

    if (existing) {
      return existing;
    }
  } catch {
    // First launch: no file yet
  }

  const id = randomId();
  await FileSystem.writeAsStringAsync(FILE, id);
  return id;
}

function randomId() {
  let id = "";

  for (let i = 0; i < 4; i++) {
    id += Math.floor(Math.random() * 0x100000000)
      .toString(16)
      .padStart(8, "0");
  }

  return id;
}
