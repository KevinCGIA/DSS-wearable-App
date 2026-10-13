import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, layout } from '@/theme';

type Props = {
  expanded: boolean;
  color?: string;
};

// Points down when collapsed, up when expanded.
export function ExpandChevron({ expanded, color = colors.textMuted }: Props) {
  const turn = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(turn, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [expanded, turn]);

  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <Animated.View style={{ transform: [{ rotate }] }} accessibilityElementsHidden importantForAccessibility="no">
      <Feather name="chevron-down" size={layout.icon.action} color={color} />
    </Animated.View>
  );
}
