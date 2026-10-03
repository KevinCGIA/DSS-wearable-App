import type { SensorReading } from '@/data/types';

// Test and sample readings (source 'manual') are never labelled as a real device.
export function sourceLabel(reading: SensorReading): string | null {
  if (reading.source === 'manual') return 'Test data';
  return reading.deviceName;
}
