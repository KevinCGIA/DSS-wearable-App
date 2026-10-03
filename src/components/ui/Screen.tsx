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
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  background = colors.bg,
  contentStyle,
  bottomInset = 0,
}: Props) {
  const insets = useSafeAreaInsets();

  const frame: ViewStyle = {
    flex: 1,
    backgroundColor: background,
    paddingTop: insets.top,
  };

  const inner: ViewStyle = {
    paddingHorizontal: padded ? layout.screenPadding : 0,
    paddingBottom: insets.bottom + bottomInset + spacing.lg,
  };

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
});
