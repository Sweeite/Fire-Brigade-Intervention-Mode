/**
 * Chart 5 — Time for initial determination of fire location.
 *
 * Elapsed time to access the building and reach a "primary information
 * target" (e.g. fire indicator panel / FDCIE / fire control room),
 * including moving from kerb side. Manual Section 5.4.
 *
 * Ported from the DDFE FBIM - Full sheet's Chart 5 block (and its Chart 5.1
 * travel sub-sheet, reused here via lib/travel.ts's shared `travelTime()`
 * rather than reimplemented).
 *
 * Fidelity note vs. the DDFE spreadsheet: DDFE's Chart 5 sums the "don
 * safety equipment" (Table N) cell along more than one branch path for
 * certain yes/no combinations, double-counting it. That is a spreadsheet
 * bug, not a Manual rule (the Manual only shows a single "don safety
 * equipment" box on the chart) — this implementation adds
 * `donSafetyEquipmentSeconds` at most once, only when the fire is not
 * visible on arrival.
 */

import {
  TABLE_K,
  TABLE_S_DDFE_DEFAULT,
  tableHWardenCommunicationTime,
  tableLInformationGatheringTime,
  type HindranceLevel,
  type WayFindingComplexity,
} from "../data/tables.js";
import { doorEntryTime, siteRoadTravelTime, travelTime } from "../lib/travel.js";
import type { ChartResult, DoorEntry, TravelInput } from "../types.js";

/** Fields relevant regardless of whether the fire turns out to be visible
 * on arrival — site road travel happens (if needed) before the visibility
 * assessment. */
interface Chart5CommonInput {
  /** Branch 1: is road travel within the site (kerb to building/set-up
   * area) necessary? Uses Table F's adopted 8 km/h site travel speed. */
  siteRoadTravel?: { distanceKm: number };
}

/** The "fire not visible on arrival" branch data — every field here is
 * only consulted (and every DDFE-sourced constant only added) when
 * `fireVisibleOnArrival` is false, so the discriminated union forces the
 * caller to supply exactly this data whenever it is actually needed. */
interface Chart5FireNotVisibleInput {
  fireVisibleOnArrival: false;

  /** Branch 3 (informational): are the premises occupied? Only gates
   * whether fire-warden communication (branch 6) can apply — occupancy by
   * itself contributes no time. */
  premisesOccupied?: boolean;

  /** Branch 4: pre-computed Chart 6 "don safety equipment" duration. This
   * chart does not reimplement Chart 6 — the caller/orchestrator computes
   * it separately (Table M/N) and passes the result in here. */
  donSafetyEquipmentSeconds: number;

  /** Branch 5: is forced entry required, or can doors be negotiated with
   * keys? Applies uniformly to every door in `doors` — each door's
   * `DoorEntry.method` is normalised to match `forcedEntryRequired`
   * (force -> Table I, otherwise -> Table J) rather than trusting the
   * caller to have set it consistently per door. */
  entry: {
    forcedEntryRequired: boolean;
    doors: DoorEntry[];
  };

  /** Branch 6: is an accredited fire warden present to communicate with?
   * Only contributes time when this AND `premisesOccupied` are both true. */
  fireWardenPresent?: boolean;

  /** Floor area of the building/fire compartment (m²) — used by Table H
   * (branch 6, warden communication) and Table L (branch 9, information
   * gathering at the primary information target). */
  floorAreaSqm: number;

  /** Branch 7 (optional): apply a hindrance factor for occupants still
   * evacuating/hindering brigade operations. Table S is an open dataset
   * parameter; DDFE's low/medium/high defaults are adopted for convenience
   * but not applied unless explicitly requested. */
  hindrance?: { level: HindranceLevel };

  /**
   * Branch 8 (optional): Table G "time delay for building entry" security
   * procedure. Table G's value is `null` in the AFAC dataset itself
   * ("designer to supply" — typically only relevant for high-security
   * buildings: banks, casinos, prisons). Unlike Table S, DDFE does not
   * supply a fallback default for this one either, so an omitted value is
   * simply treated as "no security procedure delay" (0s) rather than a
   * DDFE-sourced convenience default. Supply a project-specific value for
   * high-security buildings.
   */
  securityProcedureSeconds?: number;

  /** Branch 9: is fire brigade pre-fire planning documented for this
   * building? If yes, the crew travels directly to the known primary
   * information target and gathers information there (Table L). If no,
   * they instead spend way-finding time (Table K) locating it. */
  preFirePlanning:
    | { documented: true; travelToTarget: TravelInput }
    | { documented: false; wayFindingComplexity: WayFindingComplexity };
}

export type Chart5Input = Chart5CommonInput &
  ({ fireVisibleOnArrival: true } | Chart5FireNotVisibleInput);

export function chart5(input: Chart5Input): ChartResult {
  const breakdown: ChartResult["breakdown"] = [];

  // Branch 1 — site road travel, applies regardless of fire visibility.
  if (input.siteRoadTravel && input.siteRoadTravel.distanceKm > 0) {
    const seconds = siteRoadTravelTime(input.siteRoadTravel.distanceKm);
    breakdown.push({ label: "Site road travel (kerb to building)", seconds });
  }

  // Branch 2 — if the fire is visible on arrival, nothing further applies.
  if (input.fireVisibleOnArrival) {
    breakdown.push({ label: "Fire visible on arrival — no further assessment required", seconds: 0 });
    const seconds = breakdown.reduce((sum, b) => sum + b.seconds, 0);
    return { seconds, breakdown };
  }

  // Branch 4 — don safety equipment (pre-computed Chart 6 result), added
  // at most once, here.
  if (input.donSafetyEquipmentSeconds > 0) {
    breakdown.push({ label: "Don safety equipment", seconds: input.donSafetyEquipmentSeconds });
  }

  // Branch 5 — door negotiation, forced or keyed.
  if (input.entry.doors.length > 0) {
    const method: DoorEntry["method"] = input.entry.forcedEntryRequired ? "force" : "key";
    const doors = input.entry.doors.map((door) => ({ ...door, method }));
    const { seconds, breakdown: doorBreakdown } = doorEntryTime(doors);
    if (seconds > 0) breakdown.push(...doorBreakdown);
  }

  // Branch 6 — communicate with fire warden (only if occupied AND an
  // accredited warden is present).
  if (input.premisesOccupied && input.fireWardenPresent) {
    const seconds = tableHWardenCommunicationTime(input.floorAreaSqm);
    breakdown.push({ label: "Communicate with fire warden", seconds });
  }

  // Branch 7 — optional hindrance factor.
  if (input.hindrance) {
    const seconds = TABLE_S_DDFE_DEFAULT[input.hindrance.level];
    breakdown.push({ label: `Hindrance to fire brigade operations (${input.hindrance.level})`, seconds });
  }

  // Branch 8 — optional security procedure delay (Table G, open parameter).
  if (input.securityProcedureSeconds && input.securityProcedureSeconds > 0) {
    breakdown.push({ label: "Security procedure delay", seconds: input.securityProcedureSeconds });
  }

  // Branch 9 — pre-fire planning: travel + info gathering, or way-finding.
  if (input.preFirePlanning.documented) {
    const travel = travelTime(input.preFirePlanning.travelToTarget);
    if (travel.seconds > 0) breakdown.push(...travel.breakdown);
    const infoGathering = tableLInformationGatheringTime(input.floorAreaSqm);
    breakdown.push({ label: "Information gathering at primary information target", seconds: infoGathering });
  } else {
    const seconds = TABLE_K[input.preFirePlanning.wayFindingComplexity];
    breakdown.push({
      label: `Way-finding time (${input.preFirePlanning.wayFindingComplexity})`,
      seconds,
    });
  }

  const seconds = breakdown.reduce((sum, b) => sum + b.seconds, 0);
  return { seconds, breakdown };
}
