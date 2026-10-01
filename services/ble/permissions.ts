import { PermissionsAndroid, Platform } from "react-native";

function androidApiLevel(): number {
  return typeof Platform.Version === "number"
    ? Platform.Version
    : parseInt(Platform.Version, 10);
}

// Checks without prompting, so the app can avoid asking for Bluetooth
// until the user actually goes looking for a device.
export async function hasBlePermissions(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  if (androidApiLevel() >= 31) {
    const [scan, connect] = await Promise.all([
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      ),
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      ),
    ]);

    return scan && connect;
  }

  return PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
}

// Android 12 (API 31) replaced the location requirement for BLE with
// dedicated BLUETOOTH_SCAN / BLUETOOTH_CONNECT runtime permissions.
// iOS shows its own Bluetooth prompt the first time BleManager is used.
export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  if (androidApiLevel() >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);

    return (
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: "Location Permission",
      message:
        "Android needs location access to scan for Bluetooth devices. Your location is not stored.",
      buttonPositive: "OK",
    }
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}
