export const spacing = {
  xxs: 2,
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

// sm: tags. md: controls. lg: banners and fields. xl: cards. pill: truly round shapes.
export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 14,
  sheet: 20,
  pill: 999,
} as const;

export const layout = {
  screenPadding: spacing.xl,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  controlHeight: 50,
  tabBarHeight: 64,
  minTouch: 44,
  rowHeight: 52,
  // Two-line rows and rows with an avatar.
  rowHeightTall: 64,
  iconBadge: 32,
  // leading icon column, so labels line up
  rowIcon: 24,
  avatar: 44,
  avatarLarge: 96,
  statusDot: 12,
  deviceRing: 92,
  deviceRingBorder: 3,
  progressHeight: 10,
  stageBarHeight: 12,
  waveformHeight: 32,
  sheetHandle: 40,
  heroOverscroll: 1000,
  heroBackdrop: 640,
  chartHeight: 140,
  barChartHeight: 132,
  emptyStateIcon: 48,
  chipMaxWidth: 220,
  // Icon sizes: inline with text, rows and card titles, chevrons and buttons, tabs, back.
  icon: { inline: 14, row: 16, action: 18, tab: 20, nav: 24 },
  miniChartHeight: 80,
} as const;

export const elevation = {
  // flat: border only, no shadow
  card: {
    shadowColor: '#0E1B2A',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  hero: {
    shadowColor: '#14499A',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;
