/**
 * Shared types for the FBIM calculation engine.
 *
 * A "chart" corresponds to one numbered chart in Section 5 of the AFAC FBIM
 * Manual (v3.0, 2020). Each chart function takes a strongly-typed input
 * describing the branch choices for that chart and returns a ChartResult.
 */

/** A statistically-defined duration: mean and standard deviation, in seconds
 * (or the table's native unit — see each table's comment in data/tables.ts). */
export interface StatValue {
  mean: number;
  sd: number;
}

/** Result of computing a single chart: total duration plus a breakdown of
 * the individual contributing activities, for traceability/debugging. */
export interface ChartResult {
  /** Chart total, in seconds (already percentile-resolved where applicable). */
  seconds: number;
  /** Human-readable line items that were summed to reach `seconds`, in the
   * order they were added — mirrors "shaded boxes along the chosen path". */
  breakdown: Array<{ label: string; seconds: number }>;
}

/** Door/gate types from Table I (force entry) and Table J (gain entry with keys). */
export type DoorType =
  | "inwardSideHungDoor"
  | "outwardSideHungFireDoor"
  | "outwardSideHungSolidCoreDoor"
  | "inwardHollowCoreDoor"
  | "outwardHollowCoreDoor"
  | "glassDoor"
  | "rollerSecurityDoor"
  | "chainedGate";

/** A door/gate the firefighter must negotiate, and how (forced vs keyed). */
export interface DoorEntry {
  type: DoorType;
  count: number;
  method: "force" | "key";
}

/** Firefighter encumbrance level — drives horizontal travel speed (Table Q)
 * and vertical/stair travel speed (Table T). */
export type FirefighterGear =
  | "turnoutUniform"
  | "turnoutUniformWithEquipment"
  | "turnoutUniformInBA"
  | "hazIncidentSuitInBA";

/** Hose load carried while ascending/descending stairs (Table T), when
 * relevant instead of the generic BA/equipment gear tiers. */
export type StairHoseLoad =
  | "none"
  | "highPressureHose"
  | "hose65mm"
  | "hose38mm";

/** Inputs to the shared "firefighter travel" sub-calculation (Chart 9 in the
 * Manual — the Manual describes it as a reusable sub-chart invoked by
 * Charts 5, 7, 8, 10, 11 and 12; this engine implements it once as
 * `travelTime()` in lib/travel.ts and calls it from each of those charts). */
export interface TravelInput {
  doors?: DoorEntry[];
  horizontal?: {
    distanceMetres: number;
    gear: FirefighterGear;
    heavySmokeObscuration?: boolean;
  };
  vertical?:
    | {
        mode: "lift";
        storeysUp: number;
        storeysDown: number;
        storeyHeightMetres?: number; // default 3m per DDFE/manual note
        liftSpeedMetresPerSecond?: number; // default 1 m/s per DDFE (TBC in source)
        equipmentLoadingSeconds?: number; // default 30s (Table R "loading time")
      }
    | {
        mode: "stairs";
        storeysUp: number;
        storeysDown: number;
        hoseLoad: StairHoseLoad;
        heavySmokeObscuration?: boolean;
        stepsPerStorey?: number; // default 18 steps/storey (BCA D2.15 max), per DDFE
      };
}
