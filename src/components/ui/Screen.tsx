import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@/theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  background?: string;
  contentStyle?: ViewStyle;
  bottomInset?: number;
  hero?: React.ReactNode;
  heroBackground?: string;
  heroOverlap?: boolean;
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  background = colors.bg,
  contentStyle,
  bottomInset = 0,
  hero,
  heroBackground = colors.accent,
  heroOverlap = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const withHero = Boolean(hero) && scroll;

  const frame: ViewStyle = {
    flex: 1,
    backgroundColor: withHero ? heroBackground : background,
    paddingTop: insets.top,
  };

  const inner: ViewStyle = {
    paddingHorizontal: padded ? layout.screenPadding : 0,
    paddingBottom: insets.bottom + bottomInset + spacing.lg,
  };

  if (withHero) {
    return (
      <View style={frame}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          style={[styles.flex, { backgroundColor: background }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.hero, heroOverlap && styles.heroTall, { backgroundColor: heroBackground }]}>
            <View style={[styles.overscroll, { backgroundColor: heroBackground }]} />
            {hero}
          </View>
          <View style={[inner, heroOverlap && styles.overlap, contentStyle]}>{children}</View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={frame}>
      <StatusBar barStyle="dark-content" />
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[inner, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, inner, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
  },
  heroTall: { paddingBottom: spacing.giant },
  overscroll: { position: 'absolute', left: 0, right: 0, top: -layout.heroOverscroll, height: layout.heroOverscroll },
  overlap: { marginTop: -spacing.huge },
});
