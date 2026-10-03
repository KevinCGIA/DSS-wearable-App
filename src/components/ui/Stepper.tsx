import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  error?: string;
  style?: ViewStyle;
};

export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  error,
  style,
}: Props) {
  const canDecrease = !disabled && value - step >= min;
  const canIncrease = !disabled && value + step <= max;

  const decrease = () => canDecrease && onChange(value - step);
  const increase = () => canIncrease && onChange(value + step);

  return (
    <View style={style}>
      <View
        style={styles.row}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: unit ? `${value} ${unit}` : String(value) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) =>
          event.nativeEvent.actionName === 'increment' ? increase() : decrease()
        }
      >
        <Text style={[type.bodyStrong, styles.label]}>{label}</Text>
        <StepButton icon="minus" onPress={decrease} enabled={canDecrease} />
        <View style={styles.valueBox}>
          <Text style={[type.statSmall, styles.value]}>{value}</Text>
          {unit ? <Text style={[type.caption, styles.unit]}>{unit}</Text> : null}
        </View>
        <StepButton icon="plus" onPress={increase} enabled={canIncrease} />
      </View>
      {error ? <Text style={[type.caption, styles.error]}>{error}</Text> : null}
    </View>
  );
}

function StepButton({
  icon,
  onPress,
  enabled,
}: {
  icon: 'minus' | 'plus';
  onPress: () => void;
  enabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      importantForAccessibility="no"
      accessibilityElementsHidden
      style={({ pressed }) => [styles.button, !enabled && styles.buttonOff, pressed && styles.buttonPressed]}
    >
      <Feather name={icon} size={18} color={enabled ? colors.accentText : colors.disabledText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: layout.rowHeight },
  label: { flex: 1, color: colors.text },
  valueBox: { minWidth: 64, alignItems: 'center', marginHorizontal: spacing.sm },
  value: { color: colors.text },
  unit: { color: colors.textMuted },
  button: {
    width: layout.minTouch,
    height: layout.minTouch,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOff: { backgroundColor: colors.surfaceSunken },
  buttonPressed: { backgroundColor: colors.accentBorder },
  error: { color: colors.danger, marginTop: spacing.xs },
});
