const palette = {
  blue50: '#EAF3FF',
  blue100: '#D2E5FF',
  blue200: '#A9CCFF',
  blue300: '#7BB0FB',
  blue400: '#4F94F2',
  blue500: '#2B7BE4',
  blue600: '#1C61C4',
  blue700: '#14499A',
  blue900: '#0C2F63',

  ink900: '#0E1B2A',
  ink800: '#1B2C3F',
  ink700: '#2E4257',
  ink600: '#4A6076',
  ink500: '#6B8098',
  ink400: '#94A6B8',
  ink300: '#C0CCD9',
  ink200: '#DDE5EC',
  ink100: '#EDF1F6',
  ink50: '#F6F8FB',

  white: '#FFFFFF',

  pulse: '#F2506B',
  calm: '#1FA98A',
  peak: '#F0A02C',
  alert: '#D93A44',
  alertSurface: '#FDECEE',
} as const;

export const colors = {
  bg: palette.ink50,
  surface: palette.white,
  surfaceSunken: palette.ink100,
  border: palette.ink200,
  divider: palette.ink100,

  text: palette.ink900,
  textSecondary: palette.ink600,
  textMuted: palette.ink500,
  textInverse: palette.white,
  textOnAccent: palette.white,

  accent: palette.blue500,
  accentPressed: palette.blue600,
  accentSurface: palette.blue50,
  accentBorder: palette.blue100,
  accentText: palette.blue700,
  accentGradient: [palette.blue400, palette.blue600] as const,

  live: {
    surface: palette.blue500,
    surfaceSoft: palette.blue50,
    text: palette.white,
    textSoft: palette.blue700,
    border: palette.blue200,
    trackOn: palette.white,
    trackOff: palette.blue300,
  },

  session: {
    surface: palette.ink800,
    surfaceSoft: palette.ink100,
    text: palette.white,
    textSoft: palette.ink700,
    border: palette.ink200,
  },

  vital: {
    pulse: palette.pulse,
    calm: palette.calm,
    peak: palette.peak,
  },

  sleep: {
    deep: palette.blue700,
    light: palette.blue400,
    rem: palette.calm,
    awake: palette.peak,
    track: palette.ink100,
  },

  score: {
    good: palette.calm,
    fair: palette.peak,
    poor: palette.pulse,
  },

  danger: palette.alert,
  dangerSurface: palette.alertSurface,

  disabledSurface: palette.ink200,
  disabledText: palette.ink400,
} as const;

export { palette };
