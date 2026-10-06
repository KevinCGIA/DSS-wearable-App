import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { AlertItem } from '@/data/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function presentHeartRateAlert(alert: Omit<AlertItem, 'id'>): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Android 13 shows its runtime permission prompt only after a channel exists.
    await Notifications.setNotificationChannelAsync('heart-rate-alerts', {
      name: 'Heart rate alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: alert.type === 'HR_HIGH' ? 'High heart rate' : 'Low heart rate',
      body: alert.message,
      data: { deviceId: alert.deviceId ?? '', type: alert.type },
    },
    trigger: null,
  });
  return true;
}
