import type { SensorType } from '@/data/types';

// Development only: a plausible day of extra vitals for the "Add 24h of Sample Data" button,
// so the vitals cards can be tried without devices. Always saved as Test data.

export type SampleReading = { type: SensorType; value: number; t: number };

const HOUR = 3600000;

export function sampleVitals(end: number): SampleReading[] {
  const start = end - 24 * HOUR;
  const out: SampleReading[] = [];
  const jitter = (spread: number) => (Math.random() - 0.5) * spread;
  const asleep = (t: number) => {
    const hour = new Date(t).getHours();
    return hour < 7 || hour >= 23;
  };

  let energy = 0;
  let distance = 0;
  let day = new Date(start).toDateString();
  for (let t = start; t <= end; t += 15 * 60000) {
    if (new Date(t).toDateString() !== day) {
      day = new Date(t).toDateString();
      energy = 0;
      distance = 0;
    }
    out.push({ type: 'hrv', value: Math.round((asleep(t) ? 62 : 44) + jitter(16)), t });
    out.push({ type: 'spo2', value: Math.round(97 + jitter(3)), t });
    if (!asleep(t)) {
      energy += 4 + Math.random() * 10;
      distance += 40 + Math.random() * 120;
      out.push({ type: 'energy', value: Math.round(energy), t });
      out.push({ type: 'distance', value: Math.round(distance), t });
    }
  }

  for (const hoursAgo of [22, 13, 2]) {
    const t = end - hoursAgo * HOUR;
    out.push({ type: 'bp_systolic', value: Math.round(118 + jitter(14)), t });
    out.push({ type: 'bp_diastolic', value: Math.round(78 + jitter(10)), t });
    out.push({ type: 'body_temperature', value: Math.round((36.6 + jitter(0.6)) * 10) / 10, t: t + 60000 });
  }
  for (const hoursAgo of [20, 8]) {
    out.push({ type: 'glucose', value: Math.round((5.4 + jitter(1.2)) * 10) / 10, t: end - hoursAgo * HOUR });
  }
  const morning = end - 10 * HOUR;
  out.push({ type: 'weight', value: Math.round((72.4 + jitter(1)) * 10) / 10, t: morning });
  out.push({ type: 'bmi', value: 23.6, t: morning });
  out.push({ type: 'body_fat', value: Math.round((21 + jitter(2)) * 10) / 10, t: morning });

  return out.filter((r) => r.t <= end).sort((a, b) => a.t - b.t);
}
