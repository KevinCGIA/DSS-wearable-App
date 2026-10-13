import { AppRegistry, PermissionsAndroid, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

// Android pauses JS timers once the app leaves the screen. A foreground service
// (modules/dss-recording-service) keeps recording going while a wearable is connected.

type RecordingService = {
  start(title: string, text: string): Promise<void>;
  stop(): Promise<void>;
};

// null in builds without the native module: foreground recording only
const service = requireOptionalNativeModule<RecordingService>('DssRecordingService');

// The service holds this task open. On globalThis so a dev reload doesn't register it twice.
const shared = globalThis as { __dssRecordingTask?: { finish: (() => void) | null } };
if (!shared.__dssRecordingTask) {
  const task: { finish: (() => void) | null } = { finish: null };
  shared.__dssRecordingTask = task;
  AppRegistry.registerHeadlessTask('DssRecording', () => () => new Promise<void>((resolve) => { task.finish = resolve; }));
}
const recordingTask = shared.__dssRecordingTask;

// devices shown in the notification; 0 = stopped, -1 = last start refused
let shown = 0;

// Android 13+ needs permission to show the notification. Ask once; record either way.
let asked = false;
async function askToShowNotification() {
  if (asked || Number(Platform.Version) < 33) return;
  asked = true;
  try {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  } catch {
    // app is in the background; the service still runs
  }
}

export function notificationFor(devices: number) {
  return {
    title: devices === 1 ? 'Recording from 1 wearable' : `Recording from ${devices} wearables`,
    text: 'Readings keep saving while the app is in the background.',
  };
}

// devices: wearables connected or reconnecting
export function setBackgroundRecording(devices: number): void {
  if (!service || devices === shown) return;
  if (devices > 0) {
    shown = devices;
    const { title, text } = notificationFor(devices);
    // can only start while the app is on screen; a refusal is retried on the next change
    void askToShowNotification()
      // state may have changed while the prompt was open
      .then(() => (shown === devices ? service.start(title, text) : undefined))
      .catch(() => { if (shown === devices) shown = -1; });
    return;
  }
  shown = 0;
  recordingTask.finish?.();
  recordingTask.finish = null;
  service.stop().catch(() => undefined);
}
