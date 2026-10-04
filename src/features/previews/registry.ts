import { primitivesPreview } from '@/components/ui/primitives.preview';
import { notificationsPreview } from '@/features/notifications/notifications.preview';
import { alertThresholdsPreview } from '@/features/alerts/alertThresholds.preview';
import { authPreview } from '@/features/auth/auth.preview';
import { devicesPreview } from '@/features/devices/devices.preview';
import { heartRatePreview } from '@/features/heart-rate/heartRate.preview';
import { dashboardPreview } from '@/features/dashboard/dashboard.preview';
import { preferencesPreview } from '@/features/preferences/preferences.preview';
import { profilePreview } from '@/features/profile/profile.preview';
import { settingsPreview } from '@/features/settings/settings.preview';
import { sleepPreview } from '@/features/sleep/sleep.preview';
import { stepsPreview } from '@/features/steps/steps.preview';
import type { PreviewEntry } from './types';

// Add each screen's *.preview.tsx here as it is built.
export const previewEntries: PreviewEntry[] = [authPreview, dashboardPreview, sleepPreview, settingsPreview, profilePreview, devicesPreview, stepsPreview, heartRatePreview, alertThresholdsPreview, notificationsPreview, preferencesPreview, primitivesPreview];
