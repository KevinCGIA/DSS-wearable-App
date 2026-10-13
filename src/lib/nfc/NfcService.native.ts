import { Platform } from 'react-native';
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';
import { buildPairingUri, type PairingInfo, parsePairingRecords } from './pairingTag';

export type NfcAvailability = 'available' | 'disabled' | 'unsupported';

let started: Promise<void> | null = null;

function ensureStarted() {
  if (!started) started = NfcManager.start();
  return started;
}

export async function getNfcAvailability(): Promise<NfcAvailability> {
  try {
    if (!(await NfcManager.isSupported())) return 'unsupported';
    await ensureStarted();
    // iOS has no NFC on/off switch; isEnabled is Android only
    if (Platform.OS === 'android' && !(await NfcManager.isEnabled())) return 'disabled';
    return 'available';
  } catch {
    return 'unsupported';
  }
}

// Android only: opens the system NFC settings
export function openNfcSettings() {
  return NfcManager.goToNfcSetting();
}

// Resolves with the wearable on the tag, or null if it isn't a pairing tag.
// Rejects if the user cancels or the read fails.
export async function readPairingTag(): Promise<PairingInfo | null> {
  await ensureStarted();
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: "Hold your phone near the wearable's NFC tag",
    });
    const tag = await NfcManager.getTag();
    const records = (tag?.ndefMessage ?? []).map((record) => ({
      tnf: record.tnf,
      type: record.type,
      payload: record.payload as number[],
    }));
    return parsePairingRecords(records);
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}

// Writes a pairing tag to a blank NDEF tag
export async function writePairingTag(device: { deviceId: string; name: string }): Promise<void> {
  await ensureStarted();
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: `Hold your phone near a blank NFC tag to save ${device.name}`,
    });
    const bytes = Ndef.encodeMessage([Ndef.uriRecord(buildPairingUri(device))]);
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}

// Stops waiting for a tag (Android; on iOS the system sheet's Cancel does it)
export function cancelNfc() {
  return NfcManager.cancelTechnologyRequest().catch(() => undefined);
}
