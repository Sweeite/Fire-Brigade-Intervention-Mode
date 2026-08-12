/**
 * Chart 10 — Time to set up water (initial firefighter protection).
 *
 * Time to establish water for initial firefighter safety, sourced from the
 * appliance (tank + hose reel), before internal fire-related activity
 * begins — as distinct from Chart 11's *subsequent* water supply
 * requirements for prolonged search/rescue, fire control, exposure
 * protection and extinguishment. Scoped, per the Manual/dataset, to charged
 * wet hydrant systems.
 *
 * Three additive branches (Manual, Chart 10):
 *   1. If fire attack occurs directly from the fire appliance (tank +
 *      high-pressure hose reel): time to position/reposition the appliance
 *      at the appropriate entrance (Table U).
 *   2. If additional water is necessary beyond initial protection: the
 *      Chart 11 result.
 *   3. Always: time to travel from the set-up area to the fire area.
 *
 * Chart 10 conceptually depends on Chart 11's *output* only, not its code.
 * This file deliberately does NOT import chart11.ts — the caller computes
 * Chart 11 separately (when applicable) and passes its resolved
 * `seconds` value in via `waterSupplyRequirementsSeconds`. This mirrors how
 * Chart 6's result is threaded into other charts elsewhere in this engine:
 * a precomputed sub-chart result passed in, not a direct function call.
 *
 * Branch 3 (travel to fire area) is, by contrast, a direct 1:1 use of the
 * shared Chart 9 travel helper (`travelTime` from lib/travel.ts) and is
 * computed internally here rather than threaded in from outside.
 *
 * Ported from the DDFE FBIM - Full sheet's Chart 10 block.
 */

import { TABLE_U } from "../data/tables.js";
import { travelTime } from "../lib/travel.js";
import type { ChartResult, TravelInput } from "../types.js";

export interface Chart10Input {
  /** Will fire attack occur directly from the fire appliance (tank + high
   * pressure hose reel)? If so, the appliance must be positioned/repositioned
   * at the appropriate entrance first (Table U). */
  fireAttackFromAppliance: false | { applianceRepositionDistanceMetres: number };
  /** Precomputed Chart 11 result (seconds), supplied by the caller when
   * additional water beyond initial protection is necessary — i.e. when the
   * caller separately invoked `chart11()` and it returned
   * `status: "computed"`. Whether Chart 11 was needed, and whether its
   * result was actually "computed" vs "unsupported", is the caller's
   * concern; this chart just adds whatever numeric value (if any) it's given. */
  waterSupplyRequirementsSeconds?: number;
  /** Travel from the set-up area to the fire area (Chart 9). */
  travelToFireArea: TravelInput;
}

export function chart10(input: Chart10Input): ChartResult {
  const breakdown: ChartResult["breakdown"] = [];
  let seconds = 0;

  if (input.fireAttackFromAppliance) {
    const positioning =
      input.fireAttackFromAppliance.applianceRepositionDistanceMetres / TABLE_U.positioningSpeedMetresPerSecond;
    seconds += positioning;
    breakdown.push({ label: "Position appliance at appropriate entrance", seconds: positioning });
  }

  if (input.waterSupplyRequirementsSeconds) {
    seconds += input.waterSupplyRequirementsSeconds;
    breakdown.push({
      label: "Time to set up water supply requirements (Chart 11, precomputed)",
      seconds: input.waterSupplyRequirementsSeconds,
    });
  }

  const travel = travelTime(input.travelToFireArea);
  seconds += travel.seconds;
  breakdown.push(...travel.breakdown.map((b) => ({ label: `Travel to fire area — ${b.label}`, seconds: b.seconds })));

  return { seconds, breakdown };
}
