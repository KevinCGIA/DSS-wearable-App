import React, { useCallback, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, spacing } from '@/theme';

export type ExpandState = { expanded: boolean; toggle: () => void };

type Props = {
  // The collapsed card content. Gets the state so it can place an ExpandChevron.
  header: (state: ExpandState) => React.ReactNode;
  // Shown under the header while expanded.
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  // false: the card wires its own toggle area (e.g. a card with a separate tappable ring).
  pressableHeader?: boolean;
  accessibilityLabel?: string;
  padding?: number;
  style?: ViewStyle;
};

export function toggleA11y(expanded: boolean) {
  return {
    accessibilityRole: 'button' as const,
    accessibilityState: { expanded },
    accessibilityHint: expanded ? 'Collapses the card' : 'Expands the card',
  };
}

export function ExpandableCard({
  header,
  children,
  initiallyExpanded = false,
  pressableHeader = true,
  accessibilityLabel,
  padding,
  style,
}: Props) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    setExpanded((prev) => !prev);
  }, []);

  const headerNode = header({ expanded, toggle });

  return (
    <Card padding={padding} style={style}>
      {pressableHeader ? (
        <Pressable
          onPress={toggle}
          accessibilityLabel={accessibilityLabel}
          {...toggleA11y(expanded)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {headerNode}
        </Pressable>
      ) : (
        headerNode
      )}
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  body: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
});
