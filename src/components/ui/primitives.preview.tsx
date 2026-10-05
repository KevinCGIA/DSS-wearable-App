import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Header } from '@/components/ui/Header';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { Stepper } from '@/components/ui/Stepper';
import { TabBar } from '@/components/ui/TabBar';
import { Toggle } from '@/components/ui/Toggle';
import type { PreviewEntry } from '@/features/previews/types';
import type { TabKey } from '@/navigation/routes';
import { layout, spacing } from '@/theme';

const noop = () => undefined;

function RowsDemo() {
  const [autoConnect, setAutoConnect] = useState(true);
  return (
    <Screen scroll>
      <Header title="Rows & toggles" onBack={noop} />
      <Card padding={0} style={styles.block}>
        <ListRow icon="bluetooth" label="Pair a New Device" onPress={noop} />
        <ListRow icon="mail" label="Change Email" value="tarun@example.com" onPress={noop} divider />
        <ListRow icon="watch" label="Galaxy Watch8" hint="Last connected 2 min ago" divider />
        <Toggle
          label="Auto-connect"
          hint="Reconnect to your last device when the app opens"
          value={autoConnect}
          onValueChange={setAutoConnect}
          divider
        />
        <ListRow icon="log-out" label="Log Out" onPress={noop} destructive chevron={false} divider />
      </Card>
    </Screen>
  );
}

function StepperDemo() {
  const [min, setMin] = useState(50);
  const [max, setMax] = useState(120);
  return (
    <Screen scroll>
      <Header title="Stepper" onBack={noop} />
      <Card style={styles.block}>
        <Stepper label="Minimum" value={min} onChange={setMin} min={30} max={100} step={5} unit="BPM" />
        <Stepper
          label="Maximum"
          value={max}
          onChange={setMax}
          min={80}
          max={220}
          step={5}
          unit="BPM"
          error={min >= max ? 'Maximum must be above minimum.' : undefined}
        />
        <Stepper label="Disabled" value={72} onChange={noop} min={0} max={100} disabled />
      </Card>
    </Screen>
  );
}

function FeedbackDemo() {
  return (
    <Screen scroll>
      <Header title="Empty & errors" onBack={noop} />
      <View style={styles.stack}>
        <ErrorBanner message="Bluetooth is turned off. Turn it on to find your device." tone="warning" />
        <ErrorBanner message="Couldn't load your history." actionLabel="Retry" onAction={noop} />
        <ErrorBanner message="Verification email sent. Check your inbox." tone="info" />
        <Card>
          <EmptyState
            icon="watch"
            title="No paired devices yet"
            message="Devices you connect to will appear here."
            actionLabel="Scan for Devices"
            onAction={noop}
          />
        </Card>
      </View>
    </Screen>
  );
}

function AvatarDemo() {
  return (
    <Screen scroll>
      <Header title="Avatar" onBack={noop} />
      <Card style={styles.block}>
        <View style={styles.avatars}>
          <Avatar uri={null} onPress={noop} />
          <Avatar uri={null} loading />
          <Avatar uri={null} size={layout.avatarLarge} />
        </View>
      </Card>
    </Screen>
  );
}

// Tap the tabs: Dashboard | Devices | Activity | Settings, the app's final structure.
function TabBarDemo({ start }: { start: TabKey }) {
  const [active, setActive] = useState<TabKey>(start);
  return (
    <View style={styles.fill}>
      <Screen scroll>
        <Header title={`Tab bar · ${active}`} />
      </Screen>
      <TabBar active={active} onChange={setActive} />
    </View>
  );
}

export const primitivesPreview: PreviewEntry = {
  title: 'UI primitives',
  group: 'Primitives',
  states: [
    { label: 'Rows', render: () => <RowsDemo /> },
    { label: 'Stepper', render: () => <StepperDemo /> },
    { label: 'Feedback', render: () => <FeedbackDemo /> },
    { label: 'Avatar', render: () => <AvatarDemo /> },
    { label: 'Tab bar: Dashboard', render: () => <TabBarDemo start="dashboard" /> },
    { label: 'Tab bar: Activity', render: () => <TabBarDemo start="activity" /> },
  ],
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  block: { marginTop: spacing.lg },
  stack: { gap: spacing.md, marginTop: spacing.lg },
  avatars: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
});
