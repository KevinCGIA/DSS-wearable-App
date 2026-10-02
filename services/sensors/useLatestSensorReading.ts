import { useEffect, useState } from "react";

import { getAuth } from "@react-native-firebase/auth";

import { subscribeToLatestReading } from "./readings";
import { SensorReading, SensorType } from "./schema";

type LatestReadingState = {
  reading: SensorReading | null;
  loading: boolean;
  error: string | null;
};

// Live latest reading of one sensor type for the logged-in user
export function useLatestSensorReading(
  type: SensorType
): LatestReadingState {
  const [state, setState] = useState<LatestReadingState>({
    reading: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const user = getAuth().currentUser;

    if (!user) {
      setState({ reading: null, loading: false, error: null });
      return;
    }

    return subscribeToLatestReading(
      user.uid,
      type,
      (reading) => setState({ reading, loading: false, error: null }),
      (e) => {
        console.log(`Failed to load latest ${type} reading:`, e);
        setState({
          reading: null,
          loading: false,
          error: "Couldn't load your latest reading.",
        });
      }
    );
  }, [type]);

  return state;
}
