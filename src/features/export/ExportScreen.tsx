import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { ExportRange } from '@/lib/export/exportTypes';
import { colors, spacing, type } from '@/theme';

export type ExportNotice = { tone: 'success' | 'info' | 'error'; message: string };

export type ExportScreenProps = {
  range: ExportRange;
  exporting: boolean;
  notice: ExportNotice | null;
  onChangeRange: (range: ExportRange) => void;
  onExport: () => void;
  onBack: () => void;
};

const ranges: { value: ExportRange; label: string }[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

const columns = [
  ['Time', 'in UTC and in this phone’s local time'],
  ['Metric and value', 'every saved reading, in metric units'],
  ['Device', 'the wearable’s name and ID'],
  ['Source', 'device, or test for Test data'],
];

export function ExportScreen({ range, exporting, notice, onChangeRange, onExport, onBack }: ExportScreenProps) {
  return (
    <Screen scroll hero={<HeroHeader title="Export Data" subtitle="Save your readings as a spreadsheet file." onBack={onBack} />}>
      <SectionLabel title="Time range" first />
      <Card>
        <SegmentedControl options={ranges} value={range} onChange={onChangeRange} />
        <Text style={[type.caption, styles.muted, styles.gap]}>
          Readings from every wearable in that time, at full detail. Long recordings make large files; the newest
          200,000 readings are kept.
        </Text>
        <View style={styles.gap}>
          {notice ? <ErrorBanner message={notice.message} tone={notice.tone} style={styles.notice} /> : null}
          <Button label="Export CSV" icon="download" onPress={onExport} loading={exporting} fullWidth />
        </View>
      </Card>

      <SectionLabel title="What's in the file" />
      <Card>
        <CardTitle icon="file-text" title="One row per reading" />
        <View style={styles.list}>
          {columns.map(([name, detail]) => (
            <Text key={name} style={[type.body, styles.secondary]}>
              <Text style={[type.bodyStrong, styles.strong]}>{name}: </Text>
              {detail}
            </Text>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  secondary: { color: colors.textSecondary },
  strong: { color: colors.text },
  gap: { marginTop: spacing.lg },
  notice: { marginBottom: spacing.lg },
  list: { gap: spacing.sm, marginTop: spacing.lg },
});
