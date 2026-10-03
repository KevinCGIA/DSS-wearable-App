import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, type } from '@/theme';

type Size = 'hero' | 'large' | 'medium';
type Tone = 'live' | 'session' | 'onAccent';

type Props = {
  value: string | number;
  unit?: string;
  label: string;
  size?: Size;
  tone?: Tone;
  icon?: keyof typeof Feather.glyphMap;
  align?: 'left' | 'center';
  style?: ViewStyle;
};

const valueStyle = { hero: type.hero, large: type.statLarge, medium: type.statMedium };

export function StatReadout({
  value,
  unit,
  label,
  size = 'medium',
  tone = 'session',
  icon,
  align = 'left',
  style,
}: Props) {
  const onAccent = tone === 'onAccent';
  const valueColor = onAccent ? colors.textOnAccent : colors.text;
  const labelColor = onAccent ? colors.live.trackOn : colors.textMuted;
  const unitColor = onAccent ? colors.live.trackOn : colors.textSecondary;
  const alignment = align === 'center' ? 'center' : 'flex-start';

  return (
    <View style={[{ alignItems: alignment }, style]}>
      <View style={styles.labelRow}>
        {icon ? <Feather name={icon} size={14} color={labelColor} style={styles.icon} /> : null}
        <Text style={[type.label, { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[valueStyle[size], { color: valueColor }]} numberOfLines={1}>
          {value}
        </Text>
        {unit ? (
          <Text style={[type.unit, styles.unit, { color: unitColor }]}>{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  icon: { marginRight: spacing.xs + 2 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  unit: { marginLeft: spacing.xs + 2 },
});
