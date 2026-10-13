import type { SensorReading, SensorType } from '@/data/types';
import { STORED_UNITS } from '@/lib/biometrics/metrics';
import { sampleVitals } from '@/lib/biometrics/sampleData';

// Previews only: the dev sample day of extra vitals, as if one device reported them all.
export function mockVitalReadings(device: { id: string; name: string }): Partial<Record<SensorType, SensorReading[]>> {
  const out: Partial<Record<SensorType, SensorReading[]>> = {};
  sampleVitals(Date.now()).forEach((s, i) => {
    const list = out[s.type] ?? (out[s.type] = []);
    list.push({
      id: `vital-${device.id}-${i}`,
      type: s.type,
      value: s.value,
      unit: STORED_UNITS[s.type],
      timestamp: new Date(s.t),
      deviceId: device.id,
      deviceName: device.name,
      source: 'ble',
    });
  });
  for (const list of Object.values(out)) list?.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return out;
}
