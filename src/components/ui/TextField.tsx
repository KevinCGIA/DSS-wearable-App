import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, layout, radius, spacing, type } from '@/theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  secure?: boolean;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoComplete?: 'email' | 'name' | 'password' | 'new-password' | 'off';
  icon?: keyof typeof Feather.glyphMap;
  style?: ViewStyle;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  error,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  icon,
  style,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.accent : colors.border;

  return (
    <View style={style}>
      <Text style={[type.label, styles.label]}>{label}</Text>
      <View style={[styles.field, { borderColor }, focused && styles.focused]}>
        {icon ? (
          <Feather
            name={icon}
            size={layout.icon.action}
            color={focused ? colors.accent : colors.textMuted}
            style={styles.leading}
          />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secure && !revealed}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[type.body, styles.input]}
        />
        {secure ? (
          <Pressable
            onPress={() => setRevealed((prev) => !prev)}
            hitSlop={layout.hitSlop}
            style={styles.trailing}
          >
            <Feather name={revealed ? 'eye-off' : 'eye'} size={layout.icon.action} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[type.caption, styles.error]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSecondary, marginBottom: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.controlHeight,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  focused: { backgroundColor: colors.surface },
  leading: { marginRight: spacing.md },
  trailing: { marginLeft: spacing.md },
  input: { flex: 1, color: colors.text, paddingVertical: 0 },
  error: { color: colors.danger, marginTop: spacing.xs },
});
