import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';

type Props = {
  title: string;
  blurb: string;
  icon: keyof typeof Feather.glyphMap;
  bottomInset?: number;
  onBack?: () => void;
};

export function PlaceholderScreen({ title, blurb, icon, bottomInset = 0, onBack }: Props) {
  return (
    <Screen bottomInset={bottomInset}>
      <Header title={title} onBack={onBack} />
      <View style={styles.wrap}>
        <Card>
          <EmptyState icon={icon} title="Coming soon" message={blurb} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
});
