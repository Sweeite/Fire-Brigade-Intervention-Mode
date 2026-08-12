/**
 * Chart 2 — Time to dispatch resources.
 *
 * Elapsed time from information received/understood by the brigade to the
 * time the first appliance proceeds toward the fire scene.
 *
 * Ported from DDFE FBIM - Full rows 38-44, total formula C44 = SUM(C41:C42).
 */

import { TABLE_C, TABLE_D } from "../data/tables.js";
import type { ChartResult } from "../types.js";

export type DispatchRelayMethod =
  | { method: "fullyElectronicCAD" }
  | { method: "partManualCAD" }
  | { method: "phoneOrRadio" }
  | { method: "special"; seconds: number };

export interface Chart2Input {
  /** Was the call received via telephone, radio or passer-by (as opposed to
   * an automatic/electronic detection connection)? DDFE's note: "If no
   * detection system, select YES". */
  callReceivedVerbally: boolean;
  dispatchRelay: DispatchRelayMethod;
}

export function chart2(input: Chart2Input): ChartResult {
  const breakdown: ChartResult["breakdown"] = [];

  if (input.callReceivedVerbally) {
    breakdown.push({
      label: "Time to receive and take down verbal information",
      seconds: TABLE_C.receiveAndTakeDownVerbalInformation,
    });
  }

  const relaySeconds =
    input.dispatchRelay.method === "fullyElectronicCAD"
      ? TABLE_D.fullyElectronicCAD
      : input.dispatchRelay.method === "partManualCAD"
        ? TABLE_D.partManualCAD
        : input.dispatchRelay.method === "phoneOrRadio"
          ? TABLE_D.phoneOrRadio
          : input.dispatchRelay.seconds;

  breakdown.push({ label: "Time to relay dispatch information", seconds: relaySeconds });

  const seconds = breakdown.reduce((sum, b) => sum + b.seconds, 0);
  return { seconds, breakdown };
}
