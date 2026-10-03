import { primitivesPreview } from '@/components/ui/primitives.preview';
import { authPreview } from '@/features/auth/auth.preview';
import { homePreview } from '@/features/home/home.preview';
import { settingsPreview } from '@/features/settings/settings.preview';
import { sleepPreview } from '@/features/sleep/sleep.preview';
import type { PreviewEntry } from './types';

// Add each screen's *.preview.tsx here as it is built.
export const previewEntries: PreviewEntry[] = [authPreview, homePreview, sleepPreview, settingsPreview, primitivesPreview];
