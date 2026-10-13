// NFC pairing tags: which Bluetooth wearable to connect to.
// Formats: Bluetooth LE OOB records (application/vnd.bluetooth.le.oob) and this app's own
// URI tags (dsswearables://pair?id=...&name=...). No React Native imports, so it is unit testable.

export type PairingInfo = {
  // Bluetooth address. Android only: iOS connects by name.
  deviceId: string | null;
  name: string | null;
};

// NDEF record fields used here
export type TagRecord = {
  tnf: number;
  type: number[] | string;
  payload: number[];
};

export const PAIRING_URI_PREFIX = 'dsswearables://pair';

const TNF_WELL_KNOWN = 0x01;
const TNF_MIME = 0x02;
const URI_RECORD_TYPE = 'U';
const BLE_OOB_MIME_TYPE = 'application/vnd.bluetooth.le.oob';

// AD types inside a BLE OOB record
const AD_COMPLETE_LOCAL_NAME = 0x09;
const AD_SHORT_LOCAL_NAME = 0x08;
const AD_LE_DEVICE_ADDRESS = 0x1b;

export function buildPairingUri(info: { deviceId: string; name: string }) {
  return (
    `${PAIRING_URI_PREFIX}?id=${encodeURIComponent(info.deviceId)}` +
    `&name=${encodeURIComponent(info.name)}`
  );
}

// First record describing a wearable, or null
export function parsePairingRecords(records: TagRecord[]): PairingInfo | null {
  for (const record of records) {
    const type = typeToString(record.type);

    if (record.tnf === TNF_MIME && type === BLE_OOB_MIME_TYPE) {
      const info = parseBleOob(record.payload);
      if (info) return info;
    }

    if (record.tnf === TNF_WELL_KNOWN && type === URI_RECORD_TYPE) {
      const info = parsePairingUri(decodeUriPayload(record.payload));
      if (info) return info;
    }
  }

  return null;
}

export function parsePairingUri(uri: string | null): PairingInfo | null {
  if (!uri || !uri.startsWith(`${PAIRING_URI_PREFIX}?`)) {
    return null;
  }

  const params: Record<string, string> = {};

  for (const part of uri.slice(PAIRING_URI_PREFIX.length + 1).split('&')) {
    const [key, value = ''] = part.split('=');

    try {
      params[key] = decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  const deviceId = params.id || null;
  const name = params.name || null;

  return deviceId || name ? { deviceId, name } : null;
}

// Payload is a list of [length][AD type][data...] structures
function parseBleOob(payload: number[]): PairingInfo | null {
  let deviceId: string | null = null;
  let name: string | null = null;
  let i = 0;

  while (i < payload.length) {
    const length = payload[i];

    if (!length || i + length >= payload.length + 1) {
      break;
    }

    const adType = payload[i + 1];
    const data = payload.slice(i + 2, i + 1 + length);

    if (adType === AD_LE_DEVICE_ADDRESS && data.length >= 6) {
      // 6 address bytes, least significant first, then an address type
      deviceId = data
        .slice(0, 6)
        .reverse()
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(':');
    } else if (
      adType === AD_COMPLETE_LOCAL_NAME ||
      (adType === AD_SHORT_LOCAL_NAME && !name)
    ) {
      name = utf8Decode(data);
    }

    i += length + 1;
  }

  return deviceId || name ? { deviceId, name } : null;
}

// URI record: byte 0 is a prefix code. Our scheme has none, so only code 0 matches.
function decodeUriPayload(payload: number[]): string | null {
  if (payload.length < 2 || payload[0] !== 0x00) {
    return null;
  }

  return utf8Decode(payload.slice(1));
}

function typeToString(type: number[] | string) {
  return typeof type === 'string'
    ? type
    : String.fromCharCode(...type);
}

function utf8Decode(bytes: number[]) {
  try {
    return decodeURIComponent(
      bytes.map((b) => `%${b.toString(16).padStart(2, '0')}`).join('')
    );
  } catch {
    return String.fromCharCode(...bytes);
  }
}
