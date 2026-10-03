import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, layout, radius } from '@/theme';

const RINGS = [
  { size: 150, opacity: colors.heroRing[0] },
  { size: 250, opacity: colors.heroRing[1] },
  { size: 350, opacity: colors.heroRing[2] },
];

// Decorative texture behind Screen's blue hero: gradient, rings (echoing the logo guides) and a soft glow.
export function HeroBackdrop() {
  return (
    <View style={styles.root} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient
        colors={[...colors.heroGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      />
      <View style={styles.glow} />
      {RINGS.map((ring) => (
        <View
          key={ring.size}
          style={[
            styles.ring,
            {
              width: ring.size,
              height: ring.size,
              top: layout.heroRingCenterY - ring.size / 2,
              right: -ring.size / 2 + layout.heroRingInset,
              borderColor: ring.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: layout.heroBackdrop, overflow: 'hidden', pointerEvents: 'none' },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  glow: {
    position: 'absolute',
    width: layout.heroBackdrop,
    height: layout.heroBackdrop,
    borderRadius: radius.pill,
    left: -layout.heroBackdrop / 2,
    top: layout.heroBackdrop / 3,
    backgroundColor: colors.heroGlow,
  },
  ring: { position: 'absolute', borderRadius: radius.pill, borderWidth: 1.5 },
});
