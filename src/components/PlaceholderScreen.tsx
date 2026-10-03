import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  title: string;
  blurb: string;
  icon: keyof typeof Feather.glyphMap;
  bottomInset: number;
  onSignOut?: () => void;
};

export function PlaceholderScreen({ title, blurb, icon, bottomInset, onSignOut }: Props) {
  return (
    <Screen bottomInset={bottomInset}>
      <View style={styles.wrap}>
        <Card style={styles.card}>
          <View style={styles.icon}>
            <Feather name={icon} size={22} color={colors.accentText} />
          </View>
          <Text style={[type.heading, styles.title]}>{title}</Text>
          <Text style={[type.body, styles.blurb]}>{blurb}</Text>
          {onSignOut ? (
            <Button
              label="Sign out"
              variant="secondary"
              icon="log-out"
              onPress={onSignOut}
              fullWidth
              style={styles.action}
            />
          ) : null}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
  card: { alignItems: 'center' },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { color: colors.text },
  blurb: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  action: { marginTop: spacing.xl },
});
