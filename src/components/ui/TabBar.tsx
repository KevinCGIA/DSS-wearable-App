import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radius, spacing, type } from '@/theme';

export type TabKey = 'home' | 'activity' | 'history' | 'settings';

const tabs: { key: TabKey; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'activity', label: 'Activity', icon: 'activity' },
  { key: 'history', label: 'History', icon: 'bar-chart-2' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

type Props = {
  active: TabKey;
  onChange: (next: TabKey) => void;
};

export function TabBar({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.tab}>
            <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
              <Feather
                name={tab.icon}
                size={20}
                color={selected ? colors.accentText : colors.textMuted}
              />
            </View>
            <Text
              style={[
                type.caption,
                { color: selected ? colors.accentText : colors.textMuted },
              ]}
            >
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  tab: { flex: 1, alignItems: 'center' },
  iconWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  iconWrapActive: { backgroundColor: colors.accentSurface },
});
