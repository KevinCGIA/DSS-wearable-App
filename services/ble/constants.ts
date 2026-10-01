// Standard Bluetooth SIG GATT UUIDs (16-bit, expanded by ble-plx).
// Most fitness wearables and chest straps expose these.
export const GATT = {
  HEART_RATE_SERVICE: "0000180d-0000-1000-8000-00805f9b34fb",
  HEART_RATE_MEASUREMENT: "00002a37-0000-1000-8000-00805f9b34fb",
  BATTERY_SERVICE: "0000180f-0000-1000-8000-00805f9b34fb",
  BATTERY_LEVEL: "00002a19-0000-1000-8000-00805f9b34fb",
  DEVICE_INFORMATION_SERVICE: "0000180a-0000-1000-8000-00805f9b34fb",
} as const;

// How long a scan runs before stopping on its own, to save battery.
export const SCAN_TIMEOUT_MS = 15000;

// Per-attempt timeout for the GATT connection itself.
export const CONNECT_TIMEOUT_MS = 10000;

// Handshake retries: attempt 1 runs immediately, then waits
// RETRY_BASE_DELAY_MS, 2x, 4x... between attempts.
export const MAX_CONNECT_ATTEMPTS = 3;
export const RETRY_BASE_DELAY_MS = 1000;

// After an unexpected disconnect (out of range, watch rebooted),
// try this many times to reconnect before giving up.
export const MAX_AUTO_RECONNECT_ATTEMPTS = 3;

// Larger MTU means fewer packets per read on Android. iOS negotiates this itself.
export const REQUESTED_MTU = 185;
