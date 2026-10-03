import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Toggle } from '@/components/ui/Toggle';
import type { Preferences } from '@/data/types';
import { colors, radius, scaledType, spacing, type } from '@/theme';

export type PreferencesScreenProps = {
  draft: Preferences;
  saving: boolean;
  dirty: boolean;
  notice: { tone: 'success' | 'error'; message: string } | null;
  onChangeTextScale: (value: Preferences['textScale']) => void;
  onChangeUnits: (value: Preferences['units']) => void;
  onSetNotifications: (enabled: boolean) => void;
  onSave: () => void;
  onBack: () => void;
};

export function PreferencesScreen({
  draft,
  saving,
  dirty,
  notice,
  onChangeTextScale,
  onChangeUnits,
  onSetNotifications,
  onSave,
  onBack,
}: PreferencesScreenProps) {
  const sample = scaledType(draft.textScale);

  return (
    <Screen
      scroll
      hero={<HeroHeader title="Preferences" subtitle="Text size, units and notifications." onBack={onBack} />}
    >
      <Card style={styles.first}>
        <CardTitle icon="type" title="Text size" />
        <SegmentedControl
          value={draft.textScale}
          onChange={onChangeTextScale}
          options={[
            { value: 'default', label: 'Default' },
            { value: 'large', label: 'Large' },
            { value: 'xlarge', label: 'X-Large' },
          ]}
          style={styles.control}
        />
        <View style={styles.sample} accessible accessibilityLabel="Text size preview">
          <Text style={[sample.statMedium, styles.text]}>72 BPM</Text>
          <Text style={[sample.subheading, styles.text]}>Heart Rate</Text>
          <Text style={[sample.body, styles.muted]}>No readings yet. Connect your wearable to start tracking.</Text>
        </View>
        <Text style={[type.caption, styles.hint]}>
          Applies across the app, on top of your iPhone's text size setting.
        </Text>
      </Card>

      <Card style={styles.card}>
        <CardTitle icon="sliders" title="Units" />
        <SegmentedControl
          value={draft.units}
          onChange={onChangeUnits}
          options={[
            { value: 'metric', label: 'Metric' },
            { value: 'imperial', label: 'Imperial' },
          ]}
          style={styles.control}
        />
        <Text style={[type.caption, styles.hint]}>
          {draft.units === 'metric'
            ? 'Height in cm, weight in kg, distance in km.'
            : 'Height in inches, weight in pounds, distance in miles.'}
        </Text>
      </Card>

      <Card padding={0} style={styles.card}>
        <Toggle
          label="Alert notifications"
          hint="Show a phone notification when a heart rate alert fires. Alerts still appear in Notifications."
          value={draft.notifications}
          onValueChange={onSetNotifications}
        />
      </Card>

      {notice ? <ErrorBanner message={notice.message} tone={notice.tone} style={styles.card} /> : null}

      <Button
        label={dirty || saving ? 'Save' : 'Saved'}
        icon={dirty || saving ? undefined : 'check'}
        onPress={onSave}
        loading={saving}
        disabled={!dirty}
        fullWidth
        style={styles.save}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: spacing.xl },
  card: { marginTop: spacing.lg },
  control: { marginTop: spacing.lg },
  sample: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSunken,
    gap: spacing.xs,
  },
  text: { color: colors.text },
  muted: { color: colors.textSecondary },
  hint: { color: colors.textMuted, marginTop: spacing.md },
  save: { marginTop: spacing.xl },
});
