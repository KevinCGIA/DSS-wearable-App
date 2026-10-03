import { colors } from '@/theme';
import type { Segment } from '@/components/ui/StageTrack';

export type SleepStage = {
  key: 'awake' | 'rem' | 'light' | 'deep';
  label: string;
  duration: string;
  minutes: number;
  color: string;
  segments: Segment[];
};

export const lastNight = {
  totalLabel: '7h 50m',
  totalMinutes: 470,
  score: 87,
  rating: 'Good',
  start: '12:57am',
  end: '8:47am',
  restlessness: '23 min',
};

export const sleepStages: SleepStage[] = [
  {
    key: 'awake',
    label: 'Awake',
    duration: '28 min',
    minutes: 28,
    color: colors.sleep.awake,
    segments: [
      { start: 0, width: 0.04 },
      { start: 0.46, width: 0.03 },
      { start: 0.94, width: 0.06 },
    ],
  },
  {
    key: 'rem',
    label: 'REM',
    duration: '1h 22m',
    minutes: 82,
    color: colors.sleep.rem,
    segments: [
      { start: 0.18, width: 0.07 },
      { start: 0.42, width: 0.06 },
      { start: 0.64, width: 0.05 },
      { start: 0.84, width: 0.08 },
    ],
  },
  {
    key: 'light',
    label: 'Light',
    duration: '5h 27m',
    minutes: 327,
    color: colors.sleep.light,
    segments: [
      { start: 0.05, width: 0.12 },
      { start: 0.26, width: 0.15 },
      { start: 0.5, width: 0.13 },
      { start: 0.7, width: 0.13 },
      { start: 0.88, width: 0.06 },
    ],
  },
  {
    key: 'deep',
    label: 'Deep',
    duration: '1h 10m',
    minutes: 70,
    color: colors.sleep.deep,
    segments: [
      { start: 0.1, width: 0.09 },
      { start: 0.34, width: 0.07 },
      { start: 0.58, width: 0.05 },
    ],
  },
];

export const weeklySleepScore = [
  { label: 'Mon', value: 91 },
  { label: 'Tue', value: 87 },
  { label: 'Wed', value: 65 },
  { label: 'Thu', value: 69 },
  { label: 'Fri', value: 59 },
  { label: 'Sat', value: 91 },
  { label: 'Sun', value: 87 },
];

export const weeklySleepHours = [
  { label: 'Mon', value: 8.1 },
  { label: 'Tue', value: 7.8 },
  { label: 'Wed', value: 6.2 },
  { label: 'Thu', value: 6.5 },
  { label: 'Fri', value: 5.4 },
  { label: 'Sat', value: 8.4 },
  { label: 'Sun', value: 7.8 },
];

export const weeklyRestingHr = [
  { label: 'Mon', value: 58 },
  { label: 'Tue', value: 57 },
  { label: 'Wed', value: 63 },
  { label: 'Thu', value: 62 },
  { label: 'Fri', value: 66 },
  { label: 'Sat', value: 57 },
  { label: 'Sun', value: 56 },
];
