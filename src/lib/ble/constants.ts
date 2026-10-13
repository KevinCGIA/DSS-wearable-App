// Standard Bluetooth SIG GATT UUIDs (16-bit, expanded by ble-plx).
// Most fitness wearables and chest straps expose these.
export const GATT = {
  HEART_RATE_SERVICE: "0000180d-0000-1000-8000-00805f9b34fb",
  HEART_RATE_MEASUREMENT: "00002a37-0000-1000-8000-00805f9b34fb",
  BATTERY_SERVICE: "0000180f-0000-1000-8000-00805f9b34fb",
  BATTERY_LEVEL: "00002a19-0000-1000-8000-00805f9b34fb",
  DEVICE_INFORMATION_SERVICE: "0000180a-0000-1000-8000-00805f9b34fb",
  MODEL_NUMBER: "00002a24-0000-1000-8000-00805f9b34fb",
  FIRMWARE_REVISION: "00002a26-0000-1000-8000-00805f9b34fb",
} as const;

// How long a scan runs before stopping on its own, to save battery.
export const SCAN_TIMEOUT_MS = 15000;

// Per-attempt timeout for the GATT connection itself.
export const CONNECT_TIMEOUT_MS = 10000;

// Handshake retries: attempt 1 runs immediately, then waits
// RETRY_BASE_DELAY_MS, 2x, 4x... between attempts.
export const MAX_CONNECT_ATTEMPTS = 3;
export const MAX_CONNECTED_DEVICES = 4;
export const RETRY_BASE_DELAY_MS = 1000;

// After an unexpected disconnect (out of range, watch rebooted),
// try this many times to reconnect before giving up.
export const MAX_AUTO_RECONNECT_ATTEMPTS = 3;

// Larger MTU means fewer packets per read on Android. iOS negotiates this itself.
export const REQUESTED_MTU = 185;

// Heart rate monitors notify about once a second. Saving every value would
// cost ~86k Firestore writes per day of wear (free tier: 20k writes/day), and
// the 24-hour trend chart reads every saved reading (free tier: 50k reads/day).
// One reading a minute is ~1.4k per day and still plenty for the chart.
export const HEART_RATE_SAVE_INTERVAL_MS = 60000;
