import { TextStyle } from 'react-native';

// IBM Plex Sans everywhere. Numbers use the 600/700 weights with tabular figures,
// so digits keep the same width as values change.
export const fonts = {
  ui: 'IBMPlexSans_400Regular',
  uiMedium: 'IBMPlexSans_500Medium',
  uiSemiBold: 'IBMPlexSans_600SemiBold',
  uiBold: 'IBMPlexSans_700Bold',
  numeric: 'IBMPlexSans_600SemiBold',
  numericBold: 'IBMPlexSans_700Bold',
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

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
  | 'unit'
  | 'axis'
  | 'overline';

export const type: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.numericBold, fontSize: 76, lineHeight: 84, letterSpacing: -1.5, fontVariant: tabular },
  statLarge: { fontFamily: fonts.numericBold, fontSize: 40, lineHeight: 46, letterSpacing: -0.6, fontVariant: tabular },
  statMedium: { fontFamily: fonts.numericBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.4, fontVariant: tabular },
  statSmall: { fontFamily: fonts.numeric, fontSize: 20, lineHeight: 26, letterSpacing: -0.2, fontVariant: tabular },
  title: { fontFamily: fonts.uiBold, fontSize: 28, lineHeight: 36, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.uiSemiBold, fontSize: 20, lineHeight: 28, letterSpacing: -0.2 },
  subheading: { fontFamily: fonts.uiMedium, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.uiMedium, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.uiMedium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 17 },
  unit: { fontFamily: fonts.uiMedium, fontSize: 15, lineHeight: 20 },
  // Chart axis and value labels (numbers and times).
  axis: { fontFamily: fonts.numeric, fontSize: 12, lineHeight: 16, fontVariant: tabular },
  // Section labels and in-card eyebrows (uppercase text).
  overline: { fontFamily: fonts.uiMedium, fontSize: 13, lineHeight: 18, letterSpacing: 0.6 },
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
