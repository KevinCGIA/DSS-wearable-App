const BLUETOOTH_BASE = '-0000-1000-8000-00805f9b34fb';

// Advertisements can use 16-bit or expanded 128-bit SIG UUIDs.
export function canonicalGattUuid(value: string): string {
  const uuid = value.trim().toLowerCase();
  if (/^[0-9a-f]{4}$/.test(uuid)) return `0000${uuid}${BLUETOOTH_BASE}`;
  if (/^[0-9a-f]{8}$/.test(uuid)) return `${uuid}${BLUETOOTH_BASE}`;
  return uuid;
}

export function sharesAdvertisedService(advertised: string[], expected: string[]): boolean {
  const services = new Set(advertised.map(canonicalGattUuid));
  return expected.some((uuid) => services.has(canonicalGattUuid(uuid)));
}
