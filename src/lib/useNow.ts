import { useEffect, useState } from 'react';

// Re-renders periodically so "x min ago" labels stay current (Android: services/sensors/time.ts).
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
