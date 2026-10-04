// Data health badge thresholds, all in one place. Tune after real multi-device testing (Phase 2.5).

// Connected but no reading for this long → Not responding.
export const NOT_RESPONDING_AFTER_MS = 60 * 1000;

// A gap is this long or longer with no reading while connected (background time excluded).
export const GAP_MS = 30 * 1000;

// Unstable when any of these is crossed.
export const UNSTABLE_SUCCESS_RATE = 0.8;
export const UNSTABLE_DROPOUTS_PER_HOUR = 1;
export const UNSTABLE_GAPS_PER_HOUR = 6;

// History: below this success rate, or a last session with no readings → Not responding.
export const NOT_RESPONDING_SUCCESS_RATE = 0.5;
