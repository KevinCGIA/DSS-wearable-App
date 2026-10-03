import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { colors, layout, spacing, type } from '@/theme';
import type { PreviewEntry } from './types';

type Props = {
  entries: PreviewEntry[];
  onBack: () => void;
};

// Dev-only tool, so it keeps its own selection state.
export function PreviewsScreen({ entries, onBack }: Props) {
  const [entry, setEntry] = useState<PreviewEntry | null>(null);
  const [stateIndex, setStateIndex] = useState(0);

  if (entry) {
    return (
      <PreviewDetail
        entry={entry}
        stateIndex={stateIndex}
        onSelectState={setStateIndex}
        onBack={() => setEntry(null)}
      />
    );
  }

  const groups = Array.from(new Set(entries.map((e) => e.group)));

  return (
    <Screen scroll>
      <Header title="Previews" onBack={onBack} />
      {groups.map((group) => (
        <View key={group}>
          <Text style={[type.label, styles.section]}>{group}</Text>
          <Card padding={0}>
            {entries
              .filter((e) => e.group === group)
              .map((e, index) => (
                <ListRow
                  key={e.title}
                  label={e.title}
                  value={`${e.states.length} states`}
                  divider={index > 0}
                  onPress={() => {
                    setStateIndex(0);
                    setEntry(e);
                  }}
                />
              ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

function PreviewDetail({
  entry,
  stateIndex,
  onSelectState,
  onBack,
}: {
  entry: PreviewEntry;
  stateIndex: number;
  onSelectState: (index: number) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const state = entry.states[stateIndex];

  return (
    <View style={[styles.detail, { paddingTop: insets.top }]}>
      <View style={styles.toolbar}>
        <Header title={`${entry.title} · ${state.label}`} onBack={onBack} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {entry.states.map((s, index) => (
            <Button
              key={s.label}
              label={s.label}
              size="md"
              variant={index === stateIndex ? 'primary' : 'secondary'}
              onPress={() => onSelectState(index)}
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.stage}>
        <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0 }}>
          {state.render()}
        </SafeAreaInsetsContext.Provider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  detail: { flex: 1, backgroundColor: colors.bg },
  toolbar: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chips: { gap: spacing.sm, paddingTop: spacing.sm },
  stage: { flex: 1 },
});
