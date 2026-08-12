/**
 * Chart 3 — Time for firefighters to respond to dispatch call.
 *
 * Time from turnout signal activation to the appliance proceeding to the
 * scene. Ported from DDFE FBIM - Full rows 46-54, total formula C54.
 *
 * The Manual explicitly notes this chart deliberately simplifies brigade
 * crewing structure to a single staffed/unstaffed branch, ignoring finer
 * distinctions among part-time/auxiliary/volunteer arrangements.
 */

import { TABLE_E } from "../data/tables.js";
import type { ChartResult } from "../types.js";

export type Chart3Input =
  | { stationStaffedFullTime: false }
  | { stationStaffedFullTime: true; firefightersAlreadyInStation: boolean };

export function chart3(input: Chart3Input): ChartResult {
  if (!input.stationStaffedFullTime) {
    const seconds = TABLE_E.travelToStationDressAssembleLeave;
    return {
      seconds,
      breakdown: [
        { label: "Time to travel to fire station, dress, assemble, assimilate information and leave station", seconds },
      ],
    };
  }

  if (input.firefightersAlreadyInStation) {
    const seconds = TABLE_E.dressAssimilateDepart;
    return { seconds, breakdown: [{ label: "Time to dress, assimilate information and depart", seconds }] };
  }

  const seconds = TABLE_E.makeUpAndBecomeMobile;
  return { seconds, breakdown: [{ label: "Time to make up and become mobile", seconds }] };
}
