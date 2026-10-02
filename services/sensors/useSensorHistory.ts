import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getAuth } from "@react-native-firebase/auth";

import { subscribeToReadingsSince } from "./readings";
import { SensorReading, SensorType } from "./schema";

type HistoryState = {
  readings: SensorReading[];
  // The window the readings cover, in ms since epoch
  start: number;
  end: number;
  loading: boolean;
  error: string | null;
};

// Live readings of one type for the logged-in user over the last `hours`.
// The window moves forward each time the screen comes back into focus.
export function useSensorHistory(
  type: SensorType,
  hours: number
): HistoryState {
  const [end, setEnd] = useState(() => Date.now());
  const [state, setState] = useState<Omit<HistoryState, "start" | "end">>({
    readings: [],
    loading: true,
    error: null,
  });

  useFocusEffect(
    useCallback(() => {
      setEnd(Date.now());
    }, [])
  );

  const start = end - hours * 60 * 60 * 1000;

  useEffect(() => {
    const user = getAuth().currentUser;

    if (!user) {
      setState({ readings: [], loading: false, error: null });
      return;
    }

    setState((current) => ({ ...current, loading: true }));

    return subscribeToReadingsSince(
      user.uid,
      type,
      new Date(start),
      (readings) => setState({ readings, loading: false, error: null }),
      (e) => {
        console.log(`Failed to load ${type} history:`, e);
        setState({
          readings: [],
          loading: false,
          error: "Couldn't load your history.",
        });
      }
    );
  }, [type, start]);

  // New readings can arrive after `end` while the screen stays open
  const latest = state.readings[state.readings.length - 1];
  const windowEnd = Math.max(end, latest ? latest.timestamp.getTime() : 0);

  return { ...state, start, end: windowEnd };
}
