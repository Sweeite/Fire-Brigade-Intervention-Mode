/**
 * Chart 8 — Time to travel to set-up area.
 *
 * Time to reach the set-up area (inside or outside the building), on top of
 * what's already counted reaching the primary information target (Chart 5).
 * Four independent branches, per the Manual:
 *
 *  1. Road travel within the site, if necessary (Table F, via the shared
 *     `siteRoadTravelTime()`), plus an optional security-procedure delay
 *     (Table G — an open "designer to supply" parameter) gated on the same
 *     branch.
 *  2. Safety equipment donning time (Chart 6), charged here only if not
 *     already donned by the time the set-up-area travel begins. Chart 8
 *     does not reimplement Chart 6 — the caller/orchestrator computes
 *     Chart 6 separately and passes its resolved duration in.
 *  3. Internal travel to the set-up area, if the set-up area is inside the
 *     building (via the shared Chart 9 `travelTime()`). If the set-up area
 *     is outside the building this contributes 0 — it's already accounted
 *     for by the kerb-side/road travel above.
 *  4. A hindrance-factor delay on top of internal travel, if the building
 *     is not yet evacuated (Table S — an open AFAC-dataset parameter; this
 *     engine uses the DDFE default 3-tier substitute, TABLE_S_DDFE_DEFAULT).
 *     Only applicable when the set-up area is inside the building.
 *
 * Ported from DDFE FBIM - Full's Chart 8 block, restructured as discriminated
 * unions instead of DDFE's boolean-flag rows. The `safetyEquipmentAlreadyDonned`
 * and `setUpArea`/`buildingEvacuated` branches are modelled so that the
 * TypeScript compiler itself enforces which companion fields are required
 * (`donSafetyEquipmentSeconds`, `hindranceLevel`) rather than this module
 * silently defaulting them — see the note on `hindranceLevel` below for why.
 */

import { travelTime, siteRoadTravelTime } from "../lib/travel.js";
import { TABLE_S_DDFE_DEFAULT, type HindranceLevel } from "../data/tables.js";
import type { ChartResult, TravelInput } from "../types.js";

type SetUpArea =
  | { location: "outsideBuilding" }
  | {
      location: "insideBuilding";
      /** Internal travel (doors/horizontal/vertical) from the primary
       * information target to the set-up area. */
      travel: TravelInput;
      buildingEvacuated: true;
    }
  | {
      location: "insideBuilding";
      travel: TravelInput;
      buildingEvacuated: false;
      /**
       * Table S is left fully open in the AFAC Dataset ("refer to
       * evacuation model, apply an appropriate factor") with no stated
       * default tier among the DDFE calculator's low/medium/high
       * substitute values — so rather than silently guessing which tier
       * applies, this field is required whenever the building is not yet
       * evacuated and the TypeScript union enforces that at the call site.
       */
      hindranceLevel: HindranceLevel;
    };

export type Chart8Input = {
  /** Road travel within the site, if necessary to reach the set-up area. */
  roadTravel?: {
    distanceKm: number;
    /** Table G security-procedure delay (open "designer to supply"
     * parameter — typically only for high-security buildings: banks,
     * casinos, prisons etc). Defaults to 0 (no security procedure). */
    securityProcedureSeconds?: number;
  };
  setUpArea: SetUpArea;
} & (
  | { safetyEquipmentAlreadyDonned: true }
  | {
      safetyEquipmentAlreadyDonned: false;
      /** Chart 6's resolved duration, computed separately by the caller and
       * passed in here — Chart 8 does not reimplement Chart 6. */
      donSafetyEquipmentSeconds: number;
    }
);

export function chart8(input: Chart8Input): ChartResult {
  const breakdown: ChartResult["breakdown"] = [];

  if (input.roadTravel) {
    const roadSeconds = siteRoadTravelTime(input.roadTravel.distanceKm);
    breakdown.push({ label: "Road travel within site to set-up area", seconds: roadSeconds });

    const securitySeconds = input.roadTravel.securityProcedureSeconds ?? 0;
    if (securitySeconds > 0) {
      breakdown.push({ label: "Time delay for building/site security procedure", seconds: securitySeconds });
    }
  }

  if (!input.safetyEquipmentAlreadyDonned) {
    breakdown.push({
      label: "Time to don safety equipment (Chart 6, not yet donned)",
      seconds: input.donSafetyEquipmentSeconds,
    });
  }

  if (input.setUpArea.location === "outsideBuilding") {
    breakdown.push({ label: "Set-up area outside building - no internal travel required", seconds: 0 });
  } else {
    const internal = travelTime(input.setUpArea.travel);
    breakdown.push({ label: "Internal travel to set-up area", seconds: internal.seconds });

    if (!input.setUpArea.buildingEvacuated) {
      const hindranceSeconds = TABLE_S_DDFE_DEFAULT[input.setUpArea.hindranceLevel];
      breakdown.push({
        label: `Hindrance factor - building not yet evacuated (${input.setUpArea.hindranceLevel})`,
        seconds: hindranceSeconds,
      });
    }
  }

  const seconds = breakdown.reduce((sum, b) => sum + b.seconds, 0);
  return { seconds, breakdown };
}
