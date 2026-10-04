import type { ConnectionState } from '@/data/types';
import type { BleContextValue } from './BleProvider';

// Every device's connection state. Single-device BLE has one; the multi-device provider exposes a map.
export function connectionsOf(ble: BleContextValue): ConnectionState[] {
  const map = (ble as BleContextValue & { connections?: Record<string, ConnectionState> }).connections;
  return map ? Object.values(map) : [ble.connection];
}
