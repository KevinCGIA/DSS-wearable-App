import { TextStyle } from 'react-native';

export const fonts = {
  ui: 'Manrope_500Medium',
  uiMedium: 'Manrope_600SemiBold',
  uiBold: 'Manrope_700Bold',
  uiHeavy: 'Manrope_800ExtraBold',
  numeric: 'Barlow_600SemiBold',
  numericBold: 'Barlow_700Bold',
} as const;

type Variant =
  | 'hero'
  | 'statLarge'
  | 'statMedium'
  | 'statSmall'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'unit';

export const type: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.numericBold, fontSize: 76, lineHeight: 78, letterSpacing: -1.5 },
  statLarge: { fontFamily: fonts.numericBold, fontSize: 40, lineHeight: 44, letterSpacing: -0.6 },
  statMedium: { fontFamily: fonts.numericBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.4 },
  statSmall: { fontFamily: fonts.numeric, fontSize: 20, lineHeight: 24, letterSpacing: -0.2 },
  title: { fontFamily: fonts.uiHeavy, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.uiBold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  subheading: { fontFamily: fonts.uiMedium, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.uiMedium, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.uiMedium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 16 },
  unit: { fontFamily: fonts.uiMedium, fontSize: 15, lineHeight: 20 },
};
