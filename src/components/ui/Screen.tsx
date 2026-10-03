import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeroBackdrop } from '@/components/ui/HeroBackdrop';
import { colors, layout, spacing } from '@/theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  background?: string;
  contentStyle?: ViewStyle;
  bottomInset?: number;
  hero?: React.ReactNode;
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
  heroOverlap = false,
}: Props) {
  const insets = useSafeAreaInsets();

  const inner: ViewStyle = {
    paddingHorizontal: padded ? layout.screenPadding : 0,
    paddingBottom: insets.bottom + bottomInset + spacing.lg,
  };

  if (hero && scroll) {
    // The textured backdrop stays fixed; the hero text scrolls over it and the grey body slides up like a sheet.
    // The status-bar strip shows the same backdrop, so there's no seam when content scrolls under it.
    return (
      <View style={[styles.flex, { backgroundColor: background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.backdrop}>
          <HeroBackdrop />
        </View>
        <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={[styles.hero, heroOverlap && styles.heroTall, { paddingTop: insets.top }]}>{hero}</View>
          <View style={[inner, heroOverlap && styles.overlap, contentStyle]}>
            <View
              style={[styles.sheet, heroOverlap && styles.sheetOverlap, { backgroundColor: background }]}
            />
            {children}
          </View>
        </ScrollView>
        <View style={[styles.statusStrip, { height: insets.top }]}>
          <HeroBackdrop />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: background, paddingTop: insets.top }]}>
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
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0 },
  statusStrip: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', pointerEvents: 'none' },
  hero: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
  },
  heroTall: { paddingBottom: spacing.giant },
  overlap: { marginTop: -spacing.huge },
  // Grey page behind the content; extends far down so bottom overscroll stays grey.
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -layout.heroOverscroll,
    pointerEvents: 'none',
  },
  sheetOverlap: { top: spacing.huge },
});
