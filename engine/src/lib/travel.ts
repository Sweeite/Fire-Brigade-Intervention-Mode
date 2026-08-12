/**
 * Chart 9 — "Time for firefighter travel" (reusable sub-chart).
 *
 * The Manual describes Chart 9 as a general-purpose travel-time calculator
 * invoked repeatedly by other charts (5, 7, 8, 10, 11, 12) wherever
 * firefighter movement time is needed, with the explicit additive formula:
 *
 *   Total internal travel time = door entry + horizontal travel + vertical travel
 *
 * ("Road travel" — travel within the site before reaching a building
 * entrance — is a separate Table F calculation made by the calling chart
 * itself, e.g. Chart 5/8's "distance travelled through site"; it is not
 * part of this shared helper.)
 *
 * This engine implements Chart 9 once, here, rather than duplicating its
 * logic in every calling chart the way the DDFE spreadsheet's Chart
 * 5.1/8.1/10.1/12.1 sub-sheets did.
 *
 * Fidelity note vs. the DDFE spreadsheet: DDFE's descend-stairs and
 * rest-break formulas reference broken/mismatched cells (a gear-label
 * equality check that can never be true, and a stray absolute cell
 * reference left over from an earlier row layout), which would divide by
 * zero or read the wrong table row if evaluated. This implementation uses
 * the straightforward, bug-free interpretation instead: descend speed is
 * always Table T5 ("descend stairs in BA"), independent of the ascend hose
 * load, and rest-break speed is always Table T6.
 */

import { TABLE_F, TABLE_I, TABLE_J, TABLE_Q, TABLE_T, tableTAscendSpeedFor } from "../data/tables.js";
import type { ChartResult, DoorEntry, TravelInput } from "../types.js";

const REST_BREAK_TRIGGER_STOREYS = 6; // valid after 6 stair flights (108 steps)

/** Road travel time through the site (kerb side to building entrance /
 * set-up area), at the Manual's adopted 8 km/h site travel speed (Chart 5
 * note 3, Table F). Used by Chart 5 and Chart 8. */
export function siteRoadTravelTime(distanceKm: number): number {
  const speedKmh = TABLE_F.siteTravelSpeedKmh;
  const hours = distanceKm / speedKmh;
  return hours * 3600;
}

function doorTypeLabel(type: DoorEntry["type"]): string {
  return type.replace(/([A-Z])/g, " $1").toLowerCase();
}

/** Time to negotiate a set of doors/gates, via forcing or (if keyed) Table J. */
export function doorEntryTime(doors: DoorEntry[]): { seconds: number; breakdown: ChartResult["breakdown"] } {
  const breakdown: ChartResult["breakdown"] = [];
  let seconds = 0;
  for (const door of doors) {
    if (door.count <= 0) continue;
    const perDoor =
      door.method === "force"
        ? TABLE_I[door.type]
        : TABLE_J[door.type] ?? TABLE_I[door.type]; // Table J doesn't price every door type; fall back to Table I's value
    const total = perDoor * door.count;
    seconds += total;
    breakdown.push({
      label: `${door.method === "force" ? "Force" : "Key"} entry ×${door.count} (${doorTypeLabel(door.type)})`,
      seconds: total,
    });
  }
  return { seconds, breakdown };
}

/** Horizontal travel time = distance / selected speed, doubled under heavy
 * smoke obscuration (per DDFE's "factor TBC - currently set as factor of 2"
 * notes throughout the FBIM - Full sheet). Uses the Table Q 10th-percentile
 * (conservative/slow) speed for the given gear tier, matching the DDFE
 * calculator's actual working formulas — i.e. a "reasonable worst case"
 * speed, not the mean. */
export function horizontalTravelTime(input: NonNullable<TravelInput["horizontal"]>): number {
  const speed = TABLE_Q[input.gear].p10;
  const base = input.distanceMetres / speed;
  return input.heavySmokeObscuration ? base * 2 : base;
}

/** Vertical travel time (lift or stairs). */
export function verticalTravelTime(input: NonNullable<TravelInput["vertical"]>): {
  seconds: number;
  breakdown: ChartResult["breakdown"];
} {
  if (input.mode === "lift") {
    const storeyHeight = input.storeyHeightMetres ?? 3;
    const liftSpeed = input.liftSpeedMetresPerSecond ?? 1; // TBC per DDFE/manual note
    const loadingTime = input.equipmentLoadingSeconds ?? 30; // Table R loading time
    const totalDistance = (input.storeysUp + input.storeysDown) * storeyHeight;
    const seconds = totalDistance / liftSpeed + loadingTime;
    return { seconds, breakdown: [{ label: "Lift travel", seconds }] };
  }

  const steps = input.stepsPerStorey ?? 18; // BCA D2.15 max steps per flight, per DDFE convention
  const ascendSpeed = tableTAscendSpeedFor(input.hoseLoad).p10;
  const descendSpeed = TABLE_T.descendBA.p10;

  const ascendSeconds = (input.storeysUp * steps) / ascendSpeed;
  const descendSeconds = (input.storeysDown * steps) / descendSpeed;

  const restBreaksTriggered =
    input.storeysUp >= REST_BREAK_TRIGGER_STOREYS || input.storeysDown >= REST_BREAK_TRIGGER_STOREYS;
  const restBreakSpeed = TABLE_T.restBreaks.p10;
  const restBreakSeconds = restBreaksTriggered
    ? (input.storeysUp * steps) / restBreakSpeed + (input.storeysDown * steps) / restBreakSpeed
    : 0;

  const unadjusted = ascendSeconds + descendSeconds + restBreakSeconds;
  const seconds = input.heavySmokeObscuration ? unadjusted * 2 : unadjusted;

  const breakdown: ChartResult["breakdown"] = [];
  if (input.storeysUp > 0) breakdown.push({ label: "Stair ascent", seconds: ascendSeconds });
  if (input.storeysDown > 0) breakdown.push({ label: "Stair descent", seconds: descendSeconds });
  if (restBreaksTriggered) breakdown.push({ label: "Rest breaks (>=6 flights)", seconds: restBreakSeconds });
  if (input.heavySmokeObscuration) {
    breakdown.push({ label: "Heavy smoke obscuration factor (×2)", seconds: seconds - unadjusted });
  }
  return { seconds, breakdown };
}

/** Chart 9 — total internal firefighter travel time (door entry + horizontal
 * + vertical). Road travel through the site is computed separately by the
 * calling chart and added alongside this result, not inside it. */
export function travelTime(input: TravelInput): ChartResult {
  const breakdown: ChartResult["breakdown"] = [];
  let seconds = 0;

  if (input.doors && input.doors.length > 0) {
    const doors = doorEntryTime(input.doors);
    seconds += doors.seconds;
    breakdown.push(...doors.breakdown);
  }

  if (input.horizontal) {
    const h = horizontalTravelTime(input.horizontal);
    seconds += h;
    breakdown.push({ label: "Horizontal travel", seconds: h });
  }

  if (input.vertical) {
    const v = verticalTravelTime(input.vertical);
    seconds += v.seconds;
    breakdown.push(...v.breakdown);
  }

  return { seconds, breakdown };
}
