import type { SleepStageKey } from '@/data/types';
import { colors } from '@/theme';

export const stageOrder: SleepStageKey[] = ['awake', 'rem', 'light', 'deep'];

export const stageMeta: Record<SleepStageKey, { label: string; color: string }> = {
  awake: { label: 'Awake', color: colors.sleep.awake },
  rem: { label: 'REM', color: colors.sleep.rem },
  light: { label: 'Light', color: colors.sleep.light },
  deep: { label: 'Deep', color: colors.sleep.deep },
};
