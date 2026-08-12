/**
 * Chart 1 — Time for initial brigade notification.
 *
 * Elapsed time from fire detection to the point information "has been
 * received and understood by the fire brigade" (Manual, Chart 1).
 *
 * Ported from the DDFE FBIM - Full sheet's Chart 1 block (rows 19-36,
 * total formula C36), with its four brigade-notification branches
 * (direct / intermediate monitoring / telephone / special option) modelled
 * as a discriminated union instead of DDFE's raw yes/no cell soup.
 */

import { TABLE_A, TABLE_B, type SprinklerSystemType } from "../data/tables.js";
import type { ChartResult } from "../types.js";

export type BrigadeConnection =
  | { method: "direct" }
  | { method: "intermediateMonitoring"; notificationDelaySeconds: number }
  | { method: "telephone"; dialConnectionDelaySeconds: number }
  | { method: "specialOption"; delaySeconds: number };

export interface Chart1Input {
  /** Is any automatic detection or suppression system installed? */
  automaticDetectionOrSuppressionInstalled: boolean;
  /** Time to activate the automatic system, from an external detection-time
   * calculation (fire modelling) — the Manual/DDFE do not provide this as a
   * dataset constant. Only used when `automaticDetectionOrSuppressionInstalled`. */
  automaticActivationSeconds?: number;
  /** Present when sprinklers are installed — adds Table A (depressurise +
   * activate alarm) and Table B's alarm verification delay (20s). */
  sprinklers?: { systemType: SprinklerSystemType };
  /** Present when detection is by occupant cues or other non-automatic
   * means — Table B's "time to verify fire" is an open parameter. */
  manualDetection?: { via: "occupantCues" | "otherMeans"; timeToVerifyFireSeconds: number };
  /** How the fire brigade is ultimately notified. */
  brigadeConnection: BrigadeConnection;
}

export function chart1(input: Chart1Input): ChartResult {
  const breakdown: ChartResult["breakdown"] = [];

  if (input.automaticDetectionOrSuppressionInstalled) {
    const seconds = input.automaticActivationSeconds ?? 0;
    breakdown.push({ label: "Time to activate automatic detection/suppression system", seconds });
  }

  if (input.sprinklers) {
    const depressurise = TABLE_A[input.sprinklers.systemType];
    breakdown.push({ label: `Time to depressurise system and activate alarm (${input.sprinklers.systemType})`, seconds: depressurise });
    breakdown.push({ label: "Time delay for alarm verification", seconds: TABLE_B.alarmVerificationDelay });
  }

  if (input.manualDetection) {
    breakdown.push({
      label: `Time to verify fire (${input.manualDetection.via === "occupantCues" ? "occupant cues" : "other means"})`,
      seconds: input.manualDetection.timeToVerifyFireSeconds,
    });
  }

  switch (input.brigadeConnection.method) {
    case "direct":
      // Automatic, direct, uninterrupted connection — no delay.
      break;
    case "intermediateMonitoring":
      breakdown.push({
        label: "Time delay until notification of fire brigade (intermediate monitoring organisation)",
        seconds: input.brigadeConnection.notificationDelaySeconds,
      });
      break;
    case "telephone":
      breakdown.push({
        label: "Time delay for access, dial and connection (telephone notification)",
        seconds: input.brigadeConnection.dialConnectionDelaySeconds,
      });
      break;
    case "specialOption":
      breakdown.push({
        label: "Time for special option to contact fire brigade",
        seconds: input.brigadeConnection.delaySeconds,
      });
      break;
  }

  const seconds = breakdown.reduce((sum, b) => sum + b.seconds, 0);
  return { seconds, breakdown };
}
