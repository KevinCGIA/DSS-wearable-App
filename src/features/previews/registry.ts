import { primitivesPreview } from '@/components/ui/primitives.preview';
import { activityPreview } from '@/features/activity/activity.preview';
import { notificationsPreview } from '@/features/notifications/notifications.preview';
import { alertThresholdsPreview } from '@/features/alerts/alertThresholds.preview';
import { authPreview } from '@/features/auth/auth.preview';
import { addDevicePreview } from '@/features/devices/addDevice.preview';
import { deviceDetailPreview } from '@/features/devices/deviceDetail.preview';
import { devicesPreview } from '@/features/devices/devices.preview';
import { dashboardPreview } from '@/features/dashboard/dashboard.preview';
import { preferencesPreview } from '@/features/preferences/preferences.preview';
import { profilePreview } from '@/features/profile/profile.preview';
import { settingsPreview } from '@/features/settings/settings.preview';
import type { PreviewEntry } from './types';

// Add each screen's *.preview.tsx here as it is built.
export const previewEntries: PreviewEntry[] = [
  authPreview,
  dashboardPreview,
  devicesPreview,
  deviceDetailPreview,
  addDevicePreview,
  activityPreview,
  settingsPreview,
  profilePreview,
  alertThresholdsPreview,
  notificationsPreview,
  preferencesPreview,
  primitivesPreview,
];
