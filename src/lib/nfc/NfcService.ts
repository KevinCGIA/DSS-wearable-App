import type { PairingInfo } from './pairingTag';

// Web and Previews: no NFC. NfcService.native.ts is the real version on iOS and Android.

export type NfcAvailability = 'available' | 'disabled' | 'unsupported';

export async function getNfcAvailability(): Promise<NfcAvailability> {
  return 'unsupported';
}

export async function openNfcSettings(): Promise<boolean> {
  return false;
}

export async function readPairingTag(): Promise<PairingInfo | null> {
  throw new Error('NFC is not available here.');
}

export async function writePairingTag(_device: { deviceId: string; name: string }): Promise<void> {
  throw new Error('NFC is not available here.');
}

export async function cancelNfc(): Promise<void> {}
