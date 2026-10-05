import { isSameDay, useNow } from "./time";
import { useLatestSensorReading } from "./useLatestSensorReading";

// Today's step total for the logged-in user. Step readings are a running
// total for their day, so a latest reading from before midnight means no
// steps have been recorded today yet.
export function useStepsToday() {
  const { reading, loading, error } = useLatestSensorReading("steps");
  const now = useNow(60 * 1000);

  const steps =
    reading && isSameDay(reading.timestamp, new Date(now))
      ? Math.round(reading.value)
      : 0;

  return { steps, reading, loading, error, now };
}

// Rough estimates from step count, since no supported device reports
// distance or calories directly. Shown with "est." in the UI.

// Average stride is about 41.5% of height; 76 cm if height is unknown
export function estimateDistanceKm(steps: number, heightCm: number | null) {
  const strideMetres = heightCm ? (heightCm * 0.415) / 100 : 0.76;
  return (steps * strideMetres) / 1000;
}

// Walking burns roughly 0.0005 kcal per step per kg of body weight
// (about 40 kcal per 1,000 steps at 80 kg); 70 kg if weight is unknown
export function estimateActiveCalories(
  steps: number,
  weightKg: number | null
) {
  return steps * (weightKg ?? 70) * 0.0005;
}

// Profile height/weight may be saved as text ("180") or numbers; returns
// null for empty or invalid values
export function parseProfileNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return value !== "" && value != null && Number.isFinite(number) && number > 0
    ? number
    : null;
}
