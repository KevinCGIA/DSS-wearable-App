import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { AlertItem } from '@/data/types';
import { ALERT_TITLES } from './deviceAlert';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const heartRate = (alert: Pick<AlertItem, 'type'>) => alert.type === 'HR_HIGH' || alert.type === 'HR_LOW';

// Resolves false if notifications aren't allowed; the alert still shows in the app.
export async function presentAlert(alert: Omit<AlertItem, 'id'>): Promise<boolean> {
  const channelId = heartRate(alert) ? 'heart-rate-alerts' : 'device-alerts';
  if (Platform.OS === 'android') {
    // Android 13 shows its runtime permission prompt only after a channel exists.
    await Notifications.setNotificationChannelAsync(channelId, {
      name: heartRate(alert) ? 'Heart rate alerts' : 'Device alerts',
      importance: heartRate(alert) ? Notifications.AndroidImportance.HIGH : Notifications.AndroidImportance.DEFAULT,
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: ALERT_TITLES[alert.type],
      body: alert.message,
      data: { deviceId: alert.deviceId ?? '', type: alert.type },
    },
    trigger: Platform.OS === 'android' ? { channelId } : null,
  });
  return true;
}

export const presentHeartRateAlert = presentAlert;
