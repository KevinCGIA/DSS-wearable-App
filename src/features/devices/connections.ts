import type { ConnectionState } from '@/data/types';
import type { BleContextValue } from './BleProvider';

// Every device's connection state (the provider holds one per device).
export function connectionsOf(ble: BleContextValue): ConnectionState[] {
  return Object.values(ble.connections);
}
