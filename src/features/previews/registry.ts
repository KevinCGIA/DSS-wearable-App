import { primitivesPreview } from '@/components/ui/primitives.preview';
import { homePreview } from '@/features/home/home.preview';
import type { PreviewEntry } from './types';

// Add each screen's *.preview.tsx here as it is built.
export const previewEntries: PreviewEntry[] = [homePreview, primitivesPreview];
