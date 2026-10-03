export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const layout = {
  screenPadding: spacing.xl,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  controlHeight: 54,
  tabBarHeight: 64,
  minTouch: 44,
  rowHeight: 52,
  iconBadge: 32,
  avatar: 44,
  avatarLarge: 96,
  statusDot: 12,
  tabFab: 56,
  tabFabLift: 22,
  deviceRing: 92,
  deviceRingBorder: 3,
  progressHeight: 10,
  stageBarHeight: 12,
  waveformHeight: 32,
  sheetHandle: 40,
} as const;

export const elevation = {
  card: {
    shadowColor: '#0E1B2A',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  fab: {
    shadowColor: '#14499A',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  hero: {
    shadowColor: '#14499A',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;
