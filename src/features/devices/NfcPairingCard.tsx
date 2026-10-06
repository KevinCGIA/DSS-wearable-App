import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { NfcAvailability } from '@/lib/nfc/NfcService';
import { colors, spacing, type } from '@/theme';
import type { NfcStep } from './useNfcPairing';

export type NfcPairingCardProps = {
  availability: NfcAvailability | null;
  step: NfcStep;
  // Connected devices a pairing tag can be written for
  writableDevices: { deviceId: string; name: string }[];
  onPair: () => void;
  onWrite: () => void;
  onCancel: () => void;
};

const waitingText: Record<Exclude<NfcStep, 'idle'>, string> = {
  waitingForTag: "Hold your phone near the wearable's NFC tag…",
  findingDevice: 'Looking for the device…',
  writing: 'Hold your phone near a blank NFC tag…',
};

// "Pair with NFC" on the Add device screen. Hidden on phones without NFC.
export function NfcPairingCard({
  availability,
  step,
  writableDevices,
  onPair,
  onWrite,
  onCancel,
}: NfcPairingCardProps) {
  if (availability === null || availability === 'unsupported') return null;

  return (
    <>
      <SectionLabel title="Pair with NFC" />
      <Card>
        {step !== 'idle' ? (
          <>
            <View style={styles.waiting}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[type.body, styles.text]}>{waitingText[step]}</Text>
            </View>
            {step !== 'findingDevice' ? (
              <Button label="Cancel" variant="secondary" onPress={onCancel} fullWidth />
            ) : null}
          </>
        ) : (
          <>
            <Text style={[type.body, styles.text, styles.hint]}>
              Tap your phone on a wearable's NFC tag to connect without scanning.
            </Text>
            <Button label="Tap to Pair" icon="smartphone" onPress={onPair} fullWidth />
            {writableDevices.length > 0 ? (
              <Button
                label="Write Pairing Tag"
                icon="edit-3"
                variant="secondary"
                onPress={onWrite}
                fullWidth
                style={styles.second}
              />
            ) : null}
            {availability === 'disabled' ? (
              <Text style={[type.caption, styles.muted, styles.note]}>NFC is turned off on this phone.</Text>
            ) : null}
          </>
        )}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.text, flex: 1 },
  hint: { marginBottom: spacing.lg },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  second: { marginTop: spacing.md },
  muted: { color: colors.textMuted },
  note: { marginTop: spacing.md },
});
