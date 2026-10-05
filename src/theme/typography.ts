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

export type TextScale = 'default' | 'large' | 'xlarge';

export const TEXT_SCALES: Record<TextScale, number> = { default: 1, large: 1.15, xlarge: 1.3 };

const baseType: Record<Variant, TextStyle> = Object.fromEntries(
  Object.entries(type).map(([key, style]) => [key, { ...style }]),
) as Record<Variant, TextStyle>;

export function scaledType(scale: TextScale): Record<Variant, TextStyle> {
  const factor = TEXT_SCALES[scale];
  return Object.fromEntries(
    Object.entries(baseType).map(([key, style]) => [
      key,
      {
        ...style,
        fontSize: (style.fontSize ?? 0) * factor,
        lineHeight: style.lineHeight ? style.lineHeight * factor : undefined,
      },
    ]),
  ) as Record<Variant, TextStyle>;
}

// Replace styles because React Native freezes style objects after rendering them.
// The system text size (Dynamic Type) still applies on top of this.
export function applyTextScale(scale: TextScale) {
  const next = scaledType(scale);
  (Object.keys(type) as Variant[]).forEach((key) => { type[key] = next[key]; });
}
