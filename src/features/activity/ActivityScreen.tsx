import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CardTitle } from '@/components/ui/CardTitle';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { HeroHeader } from '@/components/ui/HeroHeader';
import { Screen } from '@/components/ui/Screen';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { colors, spacing, type } from '@/theme';
import type { ScrollRequest } from './ActivityFocusProvider';
import { TEST_SOURCE } from './activityModel';
import type { ActivitySection, ActivityView } from './activityModel';
import { HeartRateSection } from './HeartRateSection';
import { SleepSection } from './SleepSection';
import { SourceChips } from './SourceChips';
import { StepsSection } from './StepsSection';

export type ActivityScreenProps = {
  now: number;
  loading: boolean;
  error: string | null;
  view: ActivityView;
  bottomInset: number;
  // From a Dashboard "Open in Activity" link.
  scrollRequest: ScrollRequest | null;
  onSelect: (key: string) => void;
  onScrollHandled: () => void;
  // Development only: all write to the Test data source.
  onAddTestReading?: () => void;
  onAddSampleData?: () => void;
  onAddTestSteps?: () => void;
};

// Bio stats only, for one source at a time. Device and connection details stay in the Devices tab.
export function ActivityScreen({
  now,
  loading,
  error,
  view,
  bottomInset,
  scrollRequest,
  onSelect,
  onScrollHandled,
  onAddTestReading,
  onAddSampleData,
  onAddTestSteps,
}: ActivityScreenProps) {
  const scrollRef = useRef<ScrollView>(null);
  const heartRateRef = useRef<View>(null);
  const stepsRef = useRef<View>(null);
  const sleepRef = useRef<View>(null);
  const empty = !loading && !error && view.sources.length === 0;
  const notReported = view.selected === TEST_SOURCE ? 'No test data for this yet.' : 'Not reported by this device.';

  // Scroll to the section a Dashboard link asked for, once it's laid out.
  useEffect(() => {
    if (!scrollRequest || loading) return;
    const refs: Record<ActivitySection, React.RefObject<View | null>> = {
      'heart-rate': heartRateRef,
      steps: stepsRef,
      sleep: sleepRef,
    };
    const timer = setTimeout(() => {
      const target = refs[scrollRequest.section].current;
      const scroller = scrollRef.current;
      const content = scroller?.getInnerViewNode();
      if (target && scroller && content !== null && content !== undefined) {
        target.measureLayout(
          content,
          (_x, y) => scroller.scrollTo({ y: Math.max(0, y - spacing.lg), animated: true }),
          () => undefined,
        );
      }
      onScrollHandled();
    }, 60);
    return () => clearTimeout(timer);
  }, [scrollRequest, loading, onScrollHandled]);

  const devTools = onAddTestReading || onAddSampleData || onAddTestSteps;

  return (
    <Screen
      scroll
      scrollRef={scrollRef}
      bottomInset={bottomInset}
      hero={<HeroHeader title="Activity" subtitle="Heart rate, steps and sleep from one device at a time." />}
    >
      {error ? <ErrorBanner message={error} style={styles.first} /> : null}

      {loading ? (
        <View style={styles.loading} accessibilityLabel="Loading your data">
          <ActivityIndicator color={colors.accent} />
          <Text style={[type.body, styles.muted]}>Loading your data…</Text>
        </View>
      ) : empty ? (
        <Card style={styles.first}>
          <EmptyState icon="activity" title="No data yet" message="Connect a device in the Devices tab." />
        </Card>
      ) : (
        <>
          <SourceChips sources={view.sources} selected={view.selected} onSelect={onSelect} />

          <View ref={heartRateRef} collapsable={false}>
            <SectionLabel title="Heart Rate" />
            <HeartRateSection now={now} view={view.heartRate} notReported={notReported} />
          </View>

          <View ref={stepsRef} collapsable={false}>
            <SectionLabel title="Steps" />
            <StepsSection now={now} view={view.steps} notReported={notReported} />
          </View>

          <View ref={sleepRef} collapsable={false}>
            <SectionLabel title="Sleep" />
            <SleepSection view={view.sleep} notReported={notReported} />
          </View>
        </>
      )}

      {devTools ? (
        <Card style={styles.dev}>
          <CardTitle icon="tool" title="Development" />
          <Text style={[type.caption, styles.muted]}>Adds readings to the Test data source.</Text>
          <View style={styles.devButtons}>
            {onAddTestReading ? (
              <Button label="Add Test Reading" variant="secondary" size="md" onPress={onAddTestReading} fullWidth />
            ) : null}
            {onAddSampleData ? (
              <Button label="Add 24h of Sample Data" variant="secondary" size="md" onPress={onAddSampleData} fullWidth />
            ) : null}
            {onAddTestSteps ? (
              <Button label="Add Test Steps" variant="secondary" size="md" onPress={onAddTestSteps} fullWidth />
            ) : null}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}


const styles = StyleSheet.create({
  first: { marginTop: spacing.xl },
  loading: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.huge },
  muted: { color: colors.textMuted },
  dev: { marginTop: spacing.xxl },
  devButtons: { gap: spacing.md, marginTop: spacing.lg },
});
