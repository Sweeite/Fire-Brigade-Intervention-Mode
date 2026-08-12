/**
 * Chart 12 — Time for search and rescue.
 *
 * Time to search smoke-logged areas and rescue trapped occupants, once
 * safety equipment/water is set up (Manual, Section 5.4).
 *
 * Critical gating condition (quoted from the Manual): "Have firefighter
 * safety limits been exceeded in the enclosure?" — if YES, search cannot be
 * undertaken in that enclosure at all ("possible loss of life or
 * property"). The same check recurs mid-search ("have firefighter safety
 * levels been exceeded during search time?"). Both are modelled as a
 * `"blocked"` branch of the discriminated `Chart12Result` union so a caller
 * can't accidentally treat a blocked search as a valid duration.
 *
 * Three components, summed when not blocked:
 *  1. Primary search — an immediate, systematic search near the fire, at
 *     ordinary (clear/light-smoke) travel speed.
 *  2. Secondary search (optional) — a thorough investigation of every
 *     compartment where occupants may need rescue, by either the
 *     "perimeter" or "area" method (caller picks one).
 *  3. Reconnaissance of adjacent enclosures (optional) — a visual check
 *     only (not a full search technique), computed via the shared Chart 9
 *     `travelTime()` sub-calculation.
 *
 * Out of scope for this MVP: the Manual describes a further loop ("are any
 * other areas now requiring search and rescue?") for searching multiple
 * areas/enclosures in sequence. This is a natural extension point — a
 * caller wanting multiple areas can call `chart12()` once per area and sum
 * the `"completed"` results themselves, bailing out immediately on the
 * first `"blocked"` result (matching the Manual's "possible loss of life or
 * property" stop condition).
 */

import { TABLE_Q, TABLE_Y } from "../data/tables.js";
import { travelTime } from "../lib/travel.js";
import type { ChartResult, TravelInput } from "../types.js";

/**
 * Firefighter tenability criteria quoted from the Manual (Section 5.4,
 * Chart 12 notes, citing Foster & Roberts 1994), measured at 1500mm above
 * floor level.
 *
 * These are reference values only, exported for documentation and future
 * integration — this MVP does not evaluate them automatically, because
 * doing so requires an external fire/smoke-condition timeline (air
 * temperature, radiant heat flux and gas-layer heights over time) that this
 * engine does not model. A caller who *does* have such a model (e.g. a
 * zone or CFD fire simulation) should evaluate these criteria themselves
 * and feed the resulting yes/no determination into
 * `Chart12Input.safetyLimitsExceededBeforeSearch` /
 * `Chart12Input.safetyLimitsExceededDuringSearch` below.
 */
export const FIREFIGHTER_TENABILITY_CRITERIA = {
  routine: { maxTimeMinutes: 25, maxAirTempCelsius: 100, maxRadiationKwPerSqm: 1 },
  hazardous: { maxTimeMinutes: 10, maxAirTempCelsius: 120, maxRadiationKwPerSqm: 3 },
  // Snatch rescue / flashover retreat.
  extreme: {
    maxTimeMinutes: 1,
    maxAirTempLowerLayerCelsius: 160,
    maxAirTempUpperLayerCelsius: 280,
    maxRadiationKwPerSqm: [4, 4.5],
  },
  // Not expected to operate in; life-threatening.
  critical: { maxTimeMinutes: 1, minAirTempCelsius: 235, minRadiationKwPerSqm: 10 },
} as const;

/** Result of Chart 12. A `"blocked"` search deliberately carries no
 * `seconds`/`breakdown` — the safety-limit gate means no duration was (or
 * could safely be) computed, and the type system prevents callers from
 * reaching for one by mistake. */
export type Chart12Result = ({ status: "completed" } & ChartResult) | { status: "blocked"; reason: string };

export interface Chart12Input {
  /** "Have firefighter safety limits been exceeded in the enclosure?" — if
   * true, search cannot be undertaken at all and nothing else in this input
   * is evaluated. See `FIREFIGHTER_TENABILITY_CRITERIA`. */
  safetyLimitsExceededBeforeSearch: boolean;
  /** "Have firefighter safety levels been exceeded during search time?" —
   * checked conceptually partway through the search. For this MVP's
   * single-pass calculation there is no partial-progress/partial-duration
   * result: if true, the outcome is the same `"blocked"` result as
   * `safetyLimitsExceededBeforeSearch`, just with a different reason. */
  safetyLimitsExceededDuringSearch?: boolean;
  /** Immediate, systematic search near the fire, at ordinary
   * (clear/light-smoke) travel speed — Table Q3 "turnout uniform in BA". */
  primarySearch: { horizontalDistanceMetres: number };
  /** Thorough investigation of every compartment where occupants may need
   * rescue, conducted once safety equipment/water is set up. Omit if a
   * secondary search is not required (e.g. the primary search resolves the
   * incident). */
  secondarySearch?:
    | { method: "perimeter"; horizontalDistanceMetres: number }
    | { method: "area"; areaSqm: number; searchTeamsAvailable: number };
  /** Visual-only check of adjacent enclosures (not a full search
   * technique) — delegates to the shared Chart 9 travel sub-calculation.
   * Omit if no adjacent-enclosure reconnaissance is needed. */
  reconnaissance?: TravelInput;
}

export function chart12(input: Chart12Input): Chart12Result {
  if (input.safetyLimitsExceededBeforeSearch) {
    return {
      status: "blocked",
      reason:
        "Firefighter safety limits exceeded in the enclosure — search cannot be undertaken (possible loss of life or property).",
    };
  }

  const breakdown: ChartResult["breakdown"] = [];
  let seconds = 0;

  // 1. Primary search — Table Y's "primary search" rate, which is itself an
  // alias for Table Q3 "turnout uniform in BA" (p10, i.e. the conservative
  // 10th-percentile speed), per the Manual's note that primary search uses
  // ordinary travel speed since it precedes full smoke-logged secondary
  // search.
  const primarySpeed = TABLE_Y.primarySearch.p10;
  const primarySeconds = input.primarySearch.horizontalDistanceMetres / primarySpeed;
  seconds += primarySeconds;
  breakdown.push({ label: "Primary search", seconds: primarySeconds });

  // 2. Secondary search (optional).
  if (input.secondarySearch) {
    if (input.secondarySearch.method === "perimeter") {
      // Perimeter method: firefighters walk the walls, at the same speed as
      // the primary search (Table Q3 p10).
      //
      // NOTE on an asymmetry in the source material: the Manual's general
      // prose describes secondary search as splitting into half-teams for
      // rotation/fatigue management, but the traceable source formula for
      // the *perimeter* method does not apply that team split — only the
      // *area* method's formula does (below). This is implemented exactly
      // per the concrete source formula (perimeter = no team split), not
      // per the more general prose, since the formula is the authoritative
      // traceable value here.
      const perimeterSeconds = input.secondarySearch.horizontalDistanceMetres / TABLE_Q.turnoutUniformInBA.p10;
      seconds += perimeterSeconds;
      breakdown.push({ label: "Secondary search (perimeter method)", seconds: perimeterSeconds });
    } else {
      // Area method: floor area divided by half the available search teams
      // (crew rotation/fatigue management, per the Manual), at Table Y's
      // secondary-search rate (m^2/s, conservative p10 value).
      const { areaSqm, searchTeamsAvailable } = input.secondarySearch;
      const areaSeconds = areaSqm / (searchTeamsAvailable / 2) / TABLE_Y.secondarySearch.p10;
      seconds += areaSeconds;
      breakdown.push({ label: "Secondary search (area method)", seconds: areaSeconds });
    }
  }

  // 3. Mid-search safety check — "have firefighter safety levels been
  // exceeded during search time?" Checked after the search-time components
  // are tallied (conceptually "during" the search) but, per the input doc
  // comment above, still resolves to a plain `"blocked"` result with no
  // partial duration.
  if (input.safetyLimitsExceededDuringSearch) {
    return {
      status: "blocked",
      reason:
        "Firefighter safety limits exceeded during search — search must be abandoned (possible loss of life or property).",
    };
  }

  // 4. Reconnaissance of adjacent enclosures (optional) — visual check
  // only, via the shared Chart 9 travel sub-calculation.
  if (input.reconnaissance) {
    const recon = travelTime(input.reconnaissance);
    seconds += recon.seconds;
    breakdown.push(...recon.breakdown.map((b) => ({ label: `Reconnaissance: ${b.label}`, seconds: b.seconds })));
  }

  return { status: "completed", seconds, breakdown };
}
