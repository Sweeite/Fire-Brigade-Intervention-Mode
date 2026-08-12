/**
 * Chart 7 — Time to assess fire.
 *
 * Time for the Officer in Charge (OIC) to survey the fire/building and form
 * a hazard assessment. Per the Manual, this is an explicit simplification:
 * the actual tactical/hazard judgement the OIC makes is not itself
 * quantifiable as a duration, so Chart 7 instead prices only the time the
 * OIC spends *physically travelling* to gather the information that
 * judgement is based on — reusing the shared Chart 9 travel sub-calculation
 * (see lib/travel.ts).
 *
 * Two survey geometries, per the Manual:
 *  - <=3 storeys: the set-up area is outside the building. The OIC's survey
 *    is a walk around the perimeter of the fire-affected area, to and from
 *    the set-up area — horizontal travel only, dressed in turnout uniform
 *    (Table Q "turnoutUniform" tier).
 *  - >3 storeys: the set-up area is inside the building, 1-2 floors below
 *    the fire compartment. The OIC travels three legs: set-up area down to
 *    one floor below the fire, up to one floor above the fire (to survey
 *    the fire floor), then back down to the set-up area. Vertical travel on
 *    all three legs is by stairs only (the Manual does not offer a lift
 *    option for this particular OIC survey), at the "ascend stairs in BA
 *    with equipment" tier (`hoseLoad: "none"`).
 *
 * If additional resources are found to be required, a flat 30s is charged
 * for the fire brigade to notify dispatch via radio (DDFE-sourced constant,
 * not a dataset table value) — the recursive dispatch/travel of those extra
 * resources is out of scope for this engine's MVP.
 *
 * Ported from DDFE FBIM - Full's Chart 7 block, restructured as a
 * discriminated union on obviousness / building height instead of DDFE's
 * boolean-flag rows.
 */

import { horizontalTravelTime, travelTime } from "../lib/travel.js";
import type { ChartResult, TravelInput } from "../types.js";

/** Time for the fire brigade to notify dispatch (via radio) that additional
 * resources are required. Flat DDFE-sourced constant, not a dataset table
 * value. Note: charging this 30s does not itself model the dispatch or
 * travel of those additional resources arriving — recursively re-entering
 * Charts 1-4 etc. for backup appliances is out of scope for this engine's
 * MVP; only the notification time is charged here. */
const ADDITIONAL_RESOURCES_NOTIFICATION_SECONDS = 30;

export type Chart7Input =
  | {
      /** Is the fire location/extent obvious without reconnaissance? If so,
       * the OIC survey is skipped entirely (0s). */
      obviousWithoutReconnaissance: true;
      /** Are additional resources required, beyond what's already responding? */
      additionalResourcesRequired?: boolean;
    }
  | {
      obviousWithoutReconnaissance: false;
      survey:
        | {
            buildingHeight: "threeStoreysOrLess";
            /** Total to-and-from walking distance (metres) for the OIC's
             * circuit of the fire-affected area's perimeter, out from and
             * back to the set-up area. The Manual/dataset gives no formula
             * relating this to building/site geometry — it is inherently a
             * project-specific site-plan measurement the designer must
             * supply directly (not a table lookup), so the caller is
             * expected to pass the full out-and-back distance here rather
             * than a one-way figure this engine would have to guess a
             * doubling factor for. */
            perimeterWalkDistanceMetres: number;
          }
        | {
            buildingHeight: "greaterThanThreeStoreys";
            /** Set-up area is inside the building, 1-2 floors below the fire
             * compartment. The OIC travels three legs to survey the fire
             * floor and return. */
            legs: {
              /** Set-up area down to one floor below the fire compartment. */
              setUpAreaToFloorBelowFire: { horizontalDistanceMetres: number; storeysDown: number };
              /** One floor below to one floor above the fire compartment,
               * to survey the fire floor in between — predominantly
               * vertical, no separate horizontal leg. */
              floorBelowToFloorAboveFire: { storeysUp: number };
              /** Back down from the floor above the fire to the set-up area. */
              backToSetUpArea: { horizontalDistanceMetres: number; storeysDown: number };
            };
          };
      /** Are additional resources required, beyond what's already responding? */
      additionalResourcesRequired?: boolean;
    };

/** Builds a TravelInput for a horizontal-plus-stair-descent survey leg,
 * dressed in turnout uniform, "ascend stairs in BA with equipment" tier
 * (hoseLoad "none") for any ascent component. */
function surveyLeg(horizontalDistanceMetres: number, storeysDown: number, storeysUp = 0): TravelInput {
  return {
    horizontal: { distanceMetres: horizontalDistanceMetres, gear: "turnoutUniform" },
    vertical: { mode: "stairs", storeysUp, storeysDown, hoseLoad: "none" },
  };
}

export function chart7(input: Chart7Input): ChartResult {
  const breakdown: ChartResult["breakdown"] = [];

  if (input.obviousWithoutReconnaissance) {
    breakdown.push({
      label: "Fire location/extent obvious without reconnaissance - OIC survey skipped",
      seconds: 0,
    });
  } else {
    const survey = input.survey;
    if (survey.buildingHeight === "threeStoreysOrLess") {
      const seconds = horizontalTravelTime({
        distanceMetres: survey.perimeterWalkDistanceMetres,
        gear: "turnoutUniform",
      });
      breakdown.push({
        label: "OIC survey: walk perimeter of fire-affected area, to and from set-up area (outside building)",
        seconds,
      });
    } else {
      const { setUpAreaToFloorBelowFire, floorBelowToFloorAboveFire, backToSetUpArea } = survey.legs;

      const legA = travelTime(
        surveyLeg(setUpAreaToFloorBelowFire.horizontalDistanceMetres, setUpAreaToFloorBelowFire.storeysDown),
      );
      breakdown.push({
        label: "OIC survey leg 1: set-up area to one floor below fire compartment",
        seconds: legA.seconds,
      });

      const legB = travelTime({
        vertical: { mode: "stairs", storeysUp: floorBelowToFloorAboveFire.storeysUp, storeysDown: 0, hoseLoad: "none" },
      });
      breakdown.push({
        label: "OIC survey leg 2: one floor below to one floor above fire compartment (survey the fire floor)",
        seconds: legB.seconds,
      });

      const legC = travelTime(
        surveyLeg(backToSetUpArea.horizontalDistanceMetres, backToSetUpArea.storeysDown),
      );
      breakdown.push({ label: "OIC survey leg 3: back to set-up area", seconds: legC.seconds });
    }
  }

  if (input.additionalResourcesRequired) {
    breakdown.push({
      label: "Time for fire brigade to notify dispatch of additional resources required (via radio)",
      seconds: ADDITIONAL_RESOURCES_NOTIFICATION_SECONDS,
    });
  }

  const seconds = breakdown.reduce((sum, b) => sum + b.seconds, 0);
  return { seconds, breakdown };
}
