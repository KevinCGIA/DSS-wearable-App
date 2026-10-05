import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabKey } from '@/navigation/routes';
import { colors, layout, radius, spacing, type } from '@/theme';

const tabs: { key: TabKey; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'devices', label: 'Devices', icon: 'bluetooth' },
  { key: 'activity', label: 'Activity', icon: 'activity' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

type Props = {
  active: TabKey;
  onChange: (next: TabKey) => void;
};

export function TabBar({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const selected = tab.key === active;
        const tint = selected ? colors.accentText : colors.textMuted;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
          >
            <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
              <Feather name={tab.icon} size={layout.icon.tab} color={tint} />
            </View>
            <Text style={[type.caption, { color: tint }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const tabBarBaseHeight = layout.tabBarHeight;

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  tab: { flex: 1, alignItems: 'center', minHeight: layout.minTouch },
  iconWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  iconWrapActive: { backgroundColor: colors.accentSurface },
});
