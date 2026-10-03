import { primitivesPreview } from '@/components/ui/primitives.preview';
import { alertThresholdsPreview } from '@/features/alerts/alertThresholds.preview';
import { authPreview } from '@/features/auth/auth.preview';
import { devicesPreview } from '@/features/devices/devices.preview';
import { fitnessPreview } from '@/features/fitness/fitness.preview';
import { heartRatePreview } from '@/features/heart-rate/heartRate.preview';
import { homePreview } from '@/features/home/home.preview';
import { settingsPreview } from '@/features/settings/settings.preview';
import { sleepPreview } from '@/features/sleep/sleep.preview';
import type { PreviewEntry } from './types';

// Add each screen's *.preview.tsx here as it is built.
export const previewEntries: PreviewEntry[] = [authPreview, homePreview, sleepPreview, settingsPreview, devicesPreview, fitnessPreview, heartRatePreview, alertThresholdsPreview, primitivesPreview];
