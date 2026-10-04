import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import { colors, spacing, type } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const pairingSteps = [
  'Turn on Bluetooth on your phone and keep your watch nearby and awake.',
  'Open the Devices tab (or tap Add device on the Dashboard).',
  'Tap Scan for Devices and pick your device from the list.',
  'Wait for Connected. Next time the app reconnects automatically if Auto-connect is on.',
];

const states = [
  { label: 'NO DEVICE', text: 'Nothing is paired or connected yet.' },
  { label: 'CONNECTING', text: 'Reaching your watch. The app retries up to 3 times.' },
  { label: 'SYNCING', text: 'Connected and setting up, or refreshing your latest data.' },
  { label: 'CONNECTED', text: 'Your watch is sending live data.' },
  { label: 'RECONNECTING', text: 'The connection dropped (out of range or watch restarted). Trying to get it back.' },
  { label: 'DISCONNECTING', text: 'Closing the connection.' },
  { label: 'FAILED', text: "Couldn't reach the watch. Check Bluetooth, move closer and tap to retry." },
];

export function HelpSheet({ visible, onClose }: Props) {
  return (
    <Sheet visible={visible} title="Help" onClose={onClose}>
      <Text style={[type.subheading, styles.heading]}>Pair your watch</Text>
      {pairingSteps.map((step, index) => (
        <View key={step} style={styles.step}>
          <Text style={[type.bodyStrong, styles.number]}>{index + 1}.</Text>
          <Text style={[type.body, styles.text]}>{step}</Text>
        </View>
      ))}

      <Text style={[type.subheading, styles.heading, styles.section]}>Connection states</Text>
      {states.map((state) => (
        <View key={state.label} style={styles.state}>
          <Text style={[type.label, styles.stateLabel]}>{state.label}</Text>
          <Text style={[type.body, styles.text]}>{state.text}</Text>
        </View>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, marginBottom: spacing.sm },
  section: { marginTop: spacing.xl },
  step: { flexDirection: 'row', marginTop: spacing.sm },
  number: { color: colors.accentText, width: spacing.xl },
  text: { color: colors.textSecondary, flex: 1 },
  state: { marginTop: spacing.md },
  stateLabel: { color: colors.text, letterSpacing: 0.6 },
});
