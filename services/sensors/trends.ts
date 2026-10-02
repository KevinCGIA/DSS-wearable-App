import { SensorReading } from "./schema";
import { isSameDay } from "./time";

export type Bucket = {
  start: number;
  end: number;
  // null when there were no readings in this bucket (e.g. watch not worn)
  value: number | null;
};

function makeBuckets(start: number, end: number, bucketMs: number): Bucket[] {
  const buckets: Bucket[] = [];

  for (let t = start; t < end; t += bucketMs) {
    buckets.push({ start: t, end: Math.min(t + bucketMs, end), value: null });
  }

  return buckets;
}

// Average heart rate per bucket. Empty buckets stay null so the chart
// shows a gap instead of a misleading drop to zero.
export function averageByBucket(
  readings: SensorReading[],
  start: number,
  end: number,
  bucketMs: number
): Bucket[] {
  const buckets = makeBuckets(start, end, bucketMs);
  const sums = new Array(buckets.length).fill(0);
  const counts = new Array(buckets.length).fill(0);

  for (const reading of readings) {
    const index = Math.floor((reading.timestamp.getTime() - start) / bucketMs);

    if (index >= 0 && index < buckets.length) {
      sums[index] += reading.value;
      counts[index] += 1;
    }
  }

  return buckets.map((bucket, i) => ({
    ...bucket,
    value: counts[i] > 0 ? sums[i] / counts[i] : null,
  }));
}

// Steps taken per bucket. Step readings are a running total for the day,
// so each bucket gets the increase since the previous reading. When the
// total resets (a new day), the new day's total so far is counted instead.
export function stepsByBucket(
  readings: SensorReading[],
  start: number,
  end: number,
  bucketMs: number
): Bucket[] {
  const buckets = makeBuckets(start, end, bucketMs).map((bucket) => ({
    ...bucket,
    value: 0,
  }));

  readings.forEach((reading, i) => {
    const time = reading.timestamp.getTime();
    const previous = readings[i - 1];
    let steps: number;

    if (previous && isSameDay(previous.timestamp, reading.timestamp)) {
      steps = Math.max(reading.value - previous.value, 0);
    } else if (previous) {
      // First reading of a new day: everything since midnight
      steps = reading.value;
    } else {
      // First reading in the window. Its total only belongs to this window
      // if its day started inside the window; otherwise part of it is from
      // before the window and there's no earlier reading to subtract.
      const midnight = new Date(time);
      midnight.setHours(0, 0, 0, 0);
      steps = midnight.getTime() >= start ? reading.value : 0;
    }

    const index = Math.floor((time - start) / bucketMs);

    if (index >= 0 && index < buckets.length) {
      buckets[index].value += steps;
    }
  });

  return buckets;
}
