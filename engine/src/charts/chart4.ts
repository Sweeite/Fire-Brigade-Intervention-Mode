/**
 * Chart 4 — Time to reach fire scene (kerb side).
 *
 * Travel time from appliance mobilisation to the street address (kerb side
 * only — no on-site travel). Per the Manual (Chart 4, note 2) and Table
 * 5.3's worked example, travel time must be sourced via digital mapping
 * software from the *second-closest* fire station, sampled across
 * Tuesday/Friday/Saturday at 08:30/12:00/17:00/23:00, with the design value
 * taken as "the median from the slowest time in the sample" — i.e. find
 * the sampled day/time whose range has the highest upper bound, then take
 * the midpoint of that range.
 *
 * Ported from DDFE FBIM - Full rows 56-77 (F76/G76/C77).
 */

import type { ChartResult } from "../types.js";

export interface TravelSample {
  dayOfWeek: "Tuesday" | "Friday" | "Saturday";
  timeOfDay: "08:30" | "12:00" | "17:00" | "23:00";
  rangeMinMinutes: number;
  rangeMaxMinutes: number;
}

export interface Chart4Input {
  /** Google-Maps-sourced travel time samples to the second-closest station,
   * per the Manual's prescribed 3-day x 4-time-of-day sampling. */
  samples: TravelSample[];
}

export function chart4(input: Chart4Input): ChartResult {
  if (input.samples.length === 0) {
    throw new Error("chart4 requires at least one travel time sample");
  }

  const slowest = input.samples.reduce((max, s) => (s.rangeMaxMinutes > max.rangeMaxMinutes ? s : max));
  const designMinutes = (slowest.rangeMinMinutes + slowest.rangeMaxMinutes) / 2;
  const seconds = designMinutes * 60;

  return {
    seconds,
    breakdown: [
      {
        label: `Travel time (median of slowest sample: ${slowest.dayOfWeek} ${slowest.timeOfDay}, ${slowest.rangeMinMinutes}-${slowest.rangeMaxMinutes} min)`,
        seconds,
      },
    ],
  };
}
