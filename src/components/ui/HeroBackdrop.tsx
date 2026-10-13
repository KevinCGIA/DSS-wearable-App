import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, layout } from '@/theme';

// Flat header colour. Screen also uses it for the status bar strip and overscroll.
export function HeroBackdrop() {
  return <View style={styles.root} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}

const styles = StyleSheet.create({
  root: { height: layout.heroBackdrop, backgroundColor: colors.hero, pointerEvents: 'none' },
});
