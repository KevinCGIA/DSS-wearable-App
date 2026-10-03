import React from 'react';
import { StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/theme';

type Props = {
  title: string;
  blurb: string;
  icon: keyof typeof Feather.glyphMap;
  bottomInset?: number;
  onBack?: () => void;
};

export function PlaceholderScreen({ title, blurb, icon, bottomInset = 0, onBack }: Props) {
  return (
    <Screen scroll bottomInset={bottomInset} hero={<HeroHeader title={title} onBack={onBack} />}>
      <Card style={styles.card}>
        <EmptyState icon={icon} title="Coming soon" message={blurb} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.xl },
});
