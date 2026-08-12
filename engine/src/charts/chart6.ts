/**
 * Chart 6 — Time to don safety equipment and gather necessary tools.
 *
 * A sub-chart invoked by multiple other charts in the full FBIM model
 * (Charts 5, 8 and 14 per the Manual; only Charts 5 and 8 are in scope for
 * this engine's MVP). Covers dismounting the appliance, donning breathing
 * apparatus (BA) and other PPE, conducting safety procedures, and gathering
 * tools — per the Manual, Section 5.4.
 *
 * Unlike Charts 1-4, this chart's duration is not a simple sum of
 * deterministic seconds: every contributing activity is a StatValue
 * (mean + standard deviation) from the dataset, and the chart resolves to a
 * single design duration at a target percentile using the Manual's Section
 * 3.3 method (`combineAll` + `resolveAtPercentile` from lib/percentile.ts) —
 * sum the means, sum the variances, then result = mean + k * sqrt(variance).
 *
 * Note: the DDFE spreadsheet's own port of this section (its Chart 6 block)
 * has internally inconsistent row-label-to-formula mappings and is flagged
 * by its own developers as an unfinished work-in-progress. Rather than
 * replicate DDFE's confused cell layout, this implementation is built
 * directly from the Manual's description of the chart plus the dataset's
 * actual Table O (4 items) / Table P (3 items) structure, which is the
 * authoritative and unambiguous source here.
 */

import { TABLE_M, TABLE_N, TABLE_O, TABLE_P } from "../data/tables.js";
import { combineAll, kFactorForPercentile, resolveAtPercentile } from "../lib/percentile.js";
import type { ChartResult, StatValue } from "../types.js";

export type SafetyProcedureItem =
  | "flushHydrant"
  | "obtainHazmatInfo"
  | "decontaminationSetup"
  | "assembleMiscEquipment";

export type ToolItem = "hydrantEquipment" | "forcedEntryTools" | "highRisePack";

const SAFETY_PROCEDURE_LABELS: Record<SafetyProcedureItem, { label: string; value: StatValue }> = {
  flushHydrant: { label: "Flush hydrant", value: TABLE_O.flushHydrant },
  obtainHazmatInfo: {
    label: "Obtain hazardous material information from communications centre",
    value: TABLE_O.obtainHazmatInfoFromCommsCentre,
  },
  decontaminationSetup: { label: "Decontamination unit set-up", value: TABLE_O.decontaminationUnitSetup },
  assembleMiscEquipment: { label: "Assemble miscellaneous safety equipment", value: TABLE_O.assembleMiscSafetyEquipment },
};

const TOOL_LABELS: Record<ToolItem, { label: string; value: StatValue }> = {
  hydrantEquipment: { label: "Hydrant equipment", value: TABLE_P.hydrantEquipment },
  forcedEntryTools: { label: "Forced entry tools", value: TABLE_P.forcedEntryTools },
  highRisePack: { label: "High-rise pack or similar", value: TABLE_P.highRisePackOrSimilar },
};

export interface Chart6Input {
  /** Is other safety equipment necessary (e.g. a hazardous incident suit),
   * beyond the standard BA donned in Table M? Adds Table N. */
  hazmatSuitRequired?: boolean;
  /** Which safety-procedure items (Table O) apply, zero or more. */
  safetyProcedures?: SafetyProcedureItem[];
  /** Which tool-gathering items (Table P) apply, zero or more. */
  toolsRequired?: ToolItem[];
  /** Target design percentile for the statistical combination, per the
   * Manual's Section 3.3 method. Defaults to 90 (the Manual's worked
   * example and the DDFE calculator's default). */
  percentile?: number;
}

export function chart6(input: Chart6Input): ChartResult {
  const percentile = input.percentile ?? 90;
  const breakdown: ChartResult["breakdown"] = [];
  const components: StatValue[] = [];

  // Always included: dismount appliance and don BA.
  components.push(TABLE_M);
  breakdown.push({
    label: `Dismount appliance and don BA (mean ${TABLE_M.mean}s, sd ${TABLE_M.sd}s)`,
    seconds: TABLE_M.mean,
  });

  if (input.hazmatSuitRequired) {
    components.push(TABLE_N);
    breakdown.push({
      label: `Don other safety equipment, e.g. hazardous incident suit (mean ${TABLE_N.mean}s, sd ${TABLE_N.sd}s)`,
      seconds: TABLE_N.mean,
    });
  }

  for (const item of input.safetyProcedures ?? []) {
    const { label, value } = SAFETY_PROCEDURE_LABELS[item];
    components.push(value);
    breakdown.push({ label: `${label} (mean ${value.mean}s, sd ${value.sd}s)`, seconds: value.mean });
  }

  for (const item of input.toolsRequired ?? []) {
    const { label, value } = TOOL_LABELS[item];
    components.push(value);
    breakdown.push({ label: `${label} (mean ${value.mean}s, sd ${value.sd}s)`, seconds: value.mean });
  }

  const combined = combineAll(components);
  const seconds = resolveAtPercentile(combined, percentile);
  const k = kFactorForPercentile(percentile);

  breakdown.push({
    label: `${percentile}th-percentile result (mean ${combined.mean.toFixed(1)}s + ${k.toFixed(2)} * sd ${combined.sd.toFixed(1)}s)`,
    seconds,
  });

  return { seconds, breakdown };
}
