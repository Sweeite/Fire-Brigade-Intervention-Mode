/**
 * FBIM engine orchestration — combines Charts 1-12 into a single running
 * timeline from "fire start" through completion of search and rescue.
 *
 * ## Known MVP simplification: sequential addition, not concurrency/Gantt
 *
 * The Manual (Section 5.2-5.3) is explicit that only Charts 1-4
 * (notification -> dispatch -> firefighter response -> reach kerb side) are
 * strictly sequential/additive. Charts 5-12 (access, assessment, set-up,
 * travel, water, search & rescue) are described as *concurrent*: "the
 * events contained within modules 5 to 12 may occur simultaneously... the
 * elapsed time within this group being the maximum time within any single
 * module plus any delays caused by other modules" — resolved in practice by
 * building a Gantt/critical-path chart of all computed activity durations,
 * not a fixed formula.
 *
 * This engine, like the DDFE Excel calculator it was ported from, computes
 * Charts 5-12 as a straightforward running sum instead of a critical-path
 * schedule. That is a genuine simplification, not a Manual rule — it
 * produces a *conservative* (longer than a true critical-path analysis
 * would likely give) total, since it charges every chart's full duration
 * back-to-back rather than crediting overlap between crews working in
 * parallel. Building a true Gantt/critical-path resolver is a natural next
 * step beyond this MVP; each chart function's `ChartResult` already exposes
 * its own duration independently, which is exactly what such a scheduler
 * would need as input.
 *
 * ## Fix vs. the DDFE source: Chart 3 was missing from its final total
 *
 * The DDFE spreadsheet's own running-total table (rows 366-377) sums
 * Notification -> Dispatch -> [skips Chart 3] -> Reach Kerb Side -> ...,
 * omitting Chart 3 ("time for firefighters to respond to dispatch call")
 * entirely from the final result, even though the Manual explicitly lists
 * it as one of the four strictly-sequential modules 1-4 ("notification,
 * dispatch, response, arrival"). This engine includes it — see
 * `runFbimEngine` below.
 */

import { chart1, type Chart1Input } from "./charts/chart1.js";
import { chart2, type Chart2Input } from "./charts/chart2.js";
import { chart3, type Chart3Input } from "./charts/chart3.js";
import { chart4, type Chart4Input } from "./charts/chart4.js";
import { chart5, type Chart5Input } from "./charts/chart5.js";
import { chart6, type Chart6Input } from "./charts/chart6.js";
import { chart7, type Chart7Input } from "./charts/chart7.js";
import { chart8, type Chart8Input } from "./charts/chart8.js";
import { chart10, type Chart10Input } from "./charts/chart10.js";
import { chart11, type Chart11Input, type Chart11Result } from "./charts/chart11.js";
import { chart12, type Chart12Input, type Chart12Result } from "./charts/chart12.js";
import type { ChartResult } from "./types.js";

export interface FbimEngineInput {
  chart1: Chart1Input;
  chart2: Chart2Input;
  chart3: Chart3Input;
  chart4: Chart4Input;
  /** Computed once; its resolved duration is threaded into both Chart 5 and
   * Chart 8 (each of which needs "time to don safety equipment" but neither
   * reimplements Chart 6 itself — see those charts' own file headers). */
  chart6: Chart6Input;
  /** A builder, not a plain value: Chart 5's input has a required
   * `donSafetyEquipmentSeconds` field in its "fire not visible" branch,
   * which can only be known after Chart 6 has been computed. The engine
   * calls this with Chart 6's resolved `seconds`. */
  chart5: (donSafetyEquipmentSeconds: number) => Chart5Input;
  chart7: Chart7Input;
  /** Same builder pattern as `chart5`, for the same reason. */
  chart8: (donSafetyEquipmentSeconds: number) => Chart8Input;
  /** Optional: only supply this when additional water beyond Chart 10's
   * initial protection is needed. Omit entirely if not needed. */
  chart11?: Chart11Input;
  /** A builder: Chart 10's input has an optional
   * `waterSupplyRequirementsSeconds` field, populated from Chart 11's
   * result (when supplied and successfully computed) or left undefined. */
  chart10: (waterSupplyRequirementsSeconds: number | undefined) => Chart10Input;
  chart12: Chart12Input;
}

export interface TimelineEntry {
  label: string;
  /** This activity's own duration, in seconds. */
  activitySeconds: number;
  /** Running total from fire start through the end of this activity. */
  cumulativeSeconds: number;
}

export interface FbimEngineResult {
  timeline: TimelineEntry[];
  /** Cumulative time from fire start through the last computed activity —
   * either completion of search & rescue, or the point at which search &
   * rescue was blocked by firefighter safety limits (see
   * `searchAndRescueBlocked`). */
  totalSeconds: number;
  totalMinutes: number;
  charts: {
    chart1: ChartResult;
    chart2: ChartResult;
    chart3: ChartResult;
    chart4: ChartResult;
    chart5: ChartResult;
    chart6: ChartResult;
    chart7: ChartResult;
    chart8: ChartResult;
    chart10: ChartResult;
    chart11: Chart11Result | { status: "not_requested" };
    chart12: Chart12Result;
  };
  /** Non-fatal notes about the run — e.g. Chart 11 was requested but
   * returned "unsupported", or search & rescue was blocked. */
  warnings: string[];
  searchAndRescueBlocked?: { reason: string };
}

export function runFbimEngine(input: FbimEngineInput): FbimEngineResult {
  const warnings: string[] = [];

  const c1 = chart1(input.chart1);
  const c2 = chart2(input.chart2);
  const c3 = chart3(input.chart3);
  const c4 = chart4(input.chart4);

  const c6 = chart6(input.chart6);
  const c5 = chart5(input.chart5(c6.seconds));
  const c7 = chart7(input.chart7);
  const c8 = chart8(input.chart8(c6.seconds));

  let c11: Chart11Result | { status: "not_requested" } = { status: "not_requested" };
  let waterSupplyRequirementsSeconds: number | undefined;
  if (input.chart11) {
    c11 = chart11(input.chart11);
    if (c11.status === "computed") {
      waterSupplyRequirementsSeconds = c11.seconds;
    } else if (c11.status === "unsupported") {
      warnings.push(`Chart 11 (water supply requirements) was requested but is unsupported: ${c11.reason}`);
    }
  }
  const c10 = chart10(input.chart10(waterSupplyRequirementsSeconds));

  const c12 = chart12(input.chart12);

  const timeline: TimelineEntry[] = [];
  let cumulative = 0;
  const add = (label: string, seconds: number) => {
    cumulative += seconds;
    timeline.push({ label, activitySeconds: seconds, cumulativeSeconds: cumulative });
  };

  add("Fire brigade notification (Chart 1)", c1.seconds);
  add("Dispatch resources (Chart 2)", c2.seconds);
  add("Firefighter response — leave station (Chart 3)", c3.seconds);
  add("Reach kerb side (Chart 4)", c4.seconds);
  add("Determine fire location (Chart 5)", c5.seconds);
  add("Assess fire (Chart 7)", c7.seconds);
  add("Travel to set-up area (Chart 8)", c8.seconds);
  add("Set up water (Charts 10 and 11)", c10.seconds);

  let searchAndRescueBlocked: { reason: string } | undefined;
  if (c12.status === "completed") {
    add("Search and rescue (Chart 12)", c12.seconds);
  } else {
    searchAndRescueBlocked = { reason: c12.reason };
    warnings.push(`Search and rescue blocked: ${c12.reason}`);
  }

  return {
    timeline,
    totalSeconds: cumulative,
    totalMinutes: cumulative / 60,
    charts: { chart1: c1, chart2: c2, chart3: c3, chart4: c4, chart5: c5, chart6: c6, chart7: c7, chart8: c8, chart10: c10, chart11: c11, chart12: c12 },
    warnings,
    searchAndRescueBlocked,
  };
}
