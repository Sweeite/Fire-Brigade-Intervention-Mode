/**
 * AFAC Fire Brigade Intervention Model — Dataset Tables A–Z.
 *
 * Source: "Fire Brigade Intervention Model Dataset", Reference Document
 * Version 2020.05, May 2020 (AFAC), cross-checked against the "FBIM Tables"
 * sheet of DDFE FBIM Appendix A Calculator V1.7.xlsm (which independently
 * transcribes the same dataset and was used as the working reference
 * implementation for this engine).
 *
 * Values marked `null` are intentionally open parameters in the source
 * document itself ("Designer to supply", "Consult with fire service",
 * "Refer to evacuation model") — not missing data. Callers must supply a
 * project-specific value for these via the relevant chart's input.
 *
 * All times are in seconds and all speeds in metres/second (or steps/second
 * for stair tables) unless noted otherwise.
 */

import type { StatValue, DoorType, FirefighterGear, StairHoseLoad } from "../types.js";

// ---------------------------------------------------------------------------
// Table A — Time to depressurise system and activate alarm
// ---------------------------------------------------------------------------
export type SprinklerSystemType =
  | "as2118.1"
  | "combinedOHIUnder1000sqm"
  | "combinedOHI1000to2000sqm"
  | "combinedOHIOver2000sqm";

export const TABLE_A: Record<SprinklerSystemType, number> = {
  "as2118.1": 180, // manual notes a range of 180-360s is provided; 180 (lower/typical) adopted
  combinedOHIUnder1000sqm: 10,
  combinedOHI1000to2000sqm: 20,
  combinedOHIOver2000sqm: 50,
};

// ---------------------------------------------------------------------------
// Table B — Times for alarms / fire verification and any notification delays
// ---------------------------------------------------------------------------
export const TABLE_B = {
  /** Time delay for alarm verification (only applies when an automatic
   * detection/suppression system exists). */
  alarmVerificationDelay: 20,
  /** Time to verify fire (manual detection via occupant cues / other means).
   * Open parameter in the source dataset — project-specific. */
  timeToVerifyFire: null as number | null,
  /** Time delay until notification of fire brigade (intermediate monitoring
   * organisation path). Open parameter. */
  notificationDelay: null as number | null,
  /** Time delay for access, dial and connection (telephone notification
   * path). Open parameter. */
  dialConnectionDelay: null as number | null,
  /** Time for a "special option" to contact the fire brigade. Open
   * parameter — to be agreed in consultation with the fire service. */
  specialOptionDelay: null as number | null,
};

// ---------------------------------------------------------------------------
// Table C — Times for receipt of information
// ---------------------------------------------------------------------------
export const TABLE_C = {
  receiveAndTakeDownVerbalInformation: 60,
  /** Open parameter (alternative option to be received/understood). */
  alternativeOptionReceived: null as number | null,
};

// ---------------------------------------------------------------------------
// Table D — Times for dispatch
// ---------------------------------------------------------------------------
export const TABLE_D = {
  /** Open parameter — special dispatch time to be assessed with the brigade. */
  specialDispatchTime: null as number | null,
  fullyElectronicCAD: 0,
  partManualCAD: 15,
  phoneOrRadio: 30,
};

// ---------------------------------------------------------------------------
// Table E — Times for firefighter response
// ---------------------------------------------------------------------------
export const TABLE_E = {
  /** Unstaffed station: travel to station, dress, assemble, assimilate
   * information and leave station. */
  travelToStationDressAssembleLeave: 480,
  /** Staffed station, firefighters in the station: dress, assimilate
   * information and depart. */
  dressAssimilateDepart: 90,
  /** Staffed station, firefighters elsewhere on-site: make up and become
   * mobile. */
  makeUpAndBecomeMobile: 60,
};

// ---------------------------------------------------------------------------
// Table F — Time travel for brigade appliances
// ---------------------------------------------------------------------------
export const TABLE_F = {
  /** Appliance travel speed through the site (km/h) — adopted constant per
   * the Manual (Chart 5, note 3) and Table F. */
  siteTravelSpeedKmh: 8,
};

// ---------------------------------------------------------------------------
// Table G — Time delay for building entry
// ---------------------------------------------------------------------------
export const TABLE_G = {
  /** Open parameter — designer to supply (typically only for high-security
   * buildings: banks, casinos, prisons etc). */
  securityProcedureDelay: null as number | null,
};

// ---------------------------------------------------------------------------
// Table H — Time to communicate with warden
// ---------------------------------------------------------------------------
export function tableHWardenCommunicationTime(floorAreaSqm: number): number {
  if (floorAreaSqm < 1000) return 30;
  if (floorAreaSqm <= 5000) return 45;
  return 90;
}

// ---------------------------------------------------------------------------
// Table I — Time to force entry
// ---------------------------------------------------------------------------
export const TABLE_I: Record<DoorType, number> = {
  inwardSideHungDoor: 30,
  outwardSideHungFireDoor: 180,
  outwardSideHungSolidCoreDoor: 90,
  inwardHollowCoreDoor: 15,
  outwardHollowCoreDoor: 45,
  glassDoor: 15,
  rollerSecurityDoor: 220,
  chainedGate: 45,
};

// ---------------------------------------------------------------------------
// Table J — Time to gain entry (with keys)
// ---------------------------------------------------------------------------
// Table J only covers 3 of the 8 Table I door types. Doors negotiated "with
// keys" that Table J does not price (e.g. a hollow-core door) fall back to
// the nearest defined type — see lib/travel.ts for the resolution rule.
export const TABLE_J: Partial<Record<DoorType, number>> = {
  inwardSideHungDoor: 10,
  outwardSideHungFireDoor: 10, // treated as "side hung door" per Table J
  outwardSideHungSolidCoreDoor: 10,
  rollerSecurityDoor: 30,
  chainedGate: 30,
};

// ---------------------------------------------------------------------------
// Table K — Time to resolve way finding
// ---------------------------------------------------------------------------
export type WayFindingComplexity =
  | "multiLevelNumerousEnclosures"
  | "multiLevelOpenPlan"
  | "singleStoreyNumerousEnclosuresOver5000sqm"
  | "singleStoreyOpenPlan"
  | "singleStoreyNumerousEnclosuresUnder5000sqm";

export const TABLE_K: Record<WayFindingComplexity, number> = {
  multiLevelNumerousEnclosures: 30,
  multiLevelOpenPlan: 10,
  singleStoreyNumerousEnclosuresOver5000sqm: 45,
  singleStoreyOpenPlan: 10,
  singleStoreyNumerousEnclosuresUnder5000sqm: 30,
};

// ---------------------------------------------------------------------------
// Table L — Time for information gathering (FDCIE interrogation, AS 1603.4)
// ---------------------------------------------------------------------------
export function tableLInformationGatheringTime(floorAreaSqm: number): number {
  if (floorAreaSqm < 5000) return 30;
  if (floorAreaSqm <= 10000) return 60;
  return 90;
}

// ---------------------------------------------------------------------------
// Table M — Time to dismount appliance and don BA
// ---------------------------------------------------------------------------
export const TABLE_M: StatValue = { mean: 88.1, sd: 34.9 };

// ---------------------------------------------------------------------------
// Table N — Time to don safety equipment (BA + hazardous incident suit)
// ---------------------------------------------------------------------------
export const TABLE_N: StatValue = { mean: 584.4, sd: 298.0 };

// ---------------------------------------------------------------------------
// Table O — Time to conduct safety procedures or assemble safety equipment
// ---------------------------------------------------------------------------
export const TABLE_O = {
  flushHydrant: { mean: 32.8, sd: 20.6 } as StatValue,
  obtainHazmatInfoFromCommsCentre: { mean: 701.0, sd: 409.5 } as StatValue,
  decontaminationUnitSetup: { mean: 764.9, sd: 186.1 } as StatValue,
  assembleMiscSafetyEquipment: { mean: 290.6, sd: 132.1 } as StatValue,
};

// ---------------------------------------------------------------------------
// Table P — Time to remove necessary tools from appliance
// ---------------------------------------------------------------------------
export const TABLE_P = {
  hydrantEquipment: { mean: 32.5, sd: 18.1 } as StatValue,
  /** No standard deviation given in the source (treated as deterministic). */
  forcedEntryTools: { mean: 25, sd: 0 } as StatValue,
  highRisePackOrSimilar: { mean: 13.5, sd: 6.0 } as StatValue,
};

// ---------------------------------------------------------------------------
// Table Q — Firefighter horizontal travel speed (m/s)
// ---------------------------------------------------------------------------
export const TABLE_Q: Record<
  FirefighterGear,
  StatValue & { p10: number }
> = {
  turnoutUniform: { mean: 2.3, sd: 1.4, p10: 1.0 },
  turnoutUniformWithEquipment: { mean: 1.9, sd: 1.3, p10: 0.55 },
  turnoutUniformInBA: { mean: 1.4, sd: 0.6, p10: 0.7 },
  hazIncidentSuitInBA: { mean: 0.8, sd: 0.5, p10: 0.2 },
};

// ---------------------------------------------------------------------------
// Table R — Firefighter vertical travel speed (lift)
// ---------------------------------------------------------------------------
export const TABLE_R = {
  /** Open parameter — "Fireman's lift" speed, designer to supply. */
  firemansLiftSpeedMetresPerSecond: null as number | null,
  /** Time to load necessary tools into the lift. */
  loadingTimeSeconds: 30,
};

// ---------------------------------------------------------------------------
// Table S — Time for hindrance factor caused by occupants evacuating
// ---------------------------------------------------------------------------
// The AFAC Dataset leaves this fully open ("refer to evacuation model, apply
// an appropriate factor"). The DDFE calculator introduced a practical
// 3-tier default (not sourced from the AFAC Dataset) which this engine
// adopts as a convenience default — callers should override with a
// project-specific evacuation-model output where available.
export type HindranceLevel = "low" | "medium" | "high";
export const TABLE_S_DDFE_DEFAULT: Record<HindranceLevel, number> = {
  low: 30,
  medium: 60,
  high: 90,
};

// ---------------------------------------------------------------------------
// Table T — Firefighter stair travel speed (steps/s)
// ---------------------------------------------------------------------------
export const TABLE_T = {
  ascendBAWithEquipment: { mean: 0.9, sd: 0.4, p10: 0.4 } as StatValue & { p10: number },
  ascendHighPressureHose: { mean: 0.5, sd: 0.3, p10: 0.18 } as StatValue & { p10: number },
  ascend65mmHose: { mean: 0.7, sd: 0.3, p10: 0.35 } as StatValue & { p10: number },
  ascend38mmHose: { mean: 0.8, sd: 0.3, p10: 0.5 } as StatValue & { p10: number },
  descendBA: { mean: 1.0, sd: 0.5, p10: 0.5 } as StatValue & { p10: number },
  /** Rest-break allowance, valid only after 6 stair flights (108 steps). */
  restBreaks: { mean: 1.9, sd: 0.8, p10: 0.8 } as StatValue & { p10: number },
};

/** Resolves the ascend/descend speed tier for a given stair hose load. */
export function tableTAscendSpeedFor(load: StairHoseLoad) {
  switch (load) {
    case "none":
      return TABLE_T.ascendBAWithEquipment;
    case "highPressureHose":
      return TABLE_T.ascendHighPressureHose;
    case "hose65mm":
      return TABLE_T.ascend65mmHose;
    case "hose38mm":
      return TABLE_T.ascend38mmHose;
  }
}

// ---------------------------------------------------------------------------
// Table U — Time to position appliance at entrance
// ---------------------------------------------------------------------------
export const TABLE_U = {
  positioningSpeedMetresPerSecond: 2,
};

// ---------------------------------------------------------------------------
// Table V — Time to lay, connect and charge hose (per 30m length)
// ---------------------------------------------------------------------------
export const TABLE_V = {
  removeConnectChargeHydrantToAppliance90mm: { mean: 144.7, sd: 90.2 } as StatValue,
  removeConnectChargeHydrantToAppliance65mm: { mean: 60.4, sd: 30.2 } as StatValue,
  removeConnectApplianceToBranch65mm: { mean: 39.4, sd: 17.4 } as StatValue,
  removeConnectApplianceToBranch38mm: { mean: 33.3, sd: 15.4 } as StatValue,
  removeConnectApplianceToBooster65mm: { mean: 45.3, sd: 17.1 } as StatValue,
  chargeDeliveryHoseFromAppliance65mm: { mean: 20.3, sd: 13.2 } as StatValue,
  chargeDeliveryHoseFromAppliance38mm: { mean: 18.4, sd: 10.2 } as StatValue,
  connectBoostedHydrantAndCharge65mm: { mean: 59.6, sd: 37.9 } as StatValue,
  connectBoostedHydrantAndCharge38mm: { mean: 40.9, sd: 17.8 } as StatValue,
};

// ---------------------------------------------------------------------------
// Table W — Time to search for external water source
// ---------------------------------------------------------------------------
export function tableWExternalWaterSearchTime(streetHydrantDistanceMetres: number): number {
  if (streetHydrantDistanceMetres < 30) return 30;
  if (streetHydrantDistanceMetres <= 60) return 90;
  return 180;
}

// ---------------------------------------------------------------------------
// Table X — Time to obtain static water
// ---------------------------------------------------------------------------
export const TABLE_X = {
  positionAppliance: { mean: 1.1, sd: 0.5 } as StatValue, // m/s
  removeSuctionHoseConnectToTankPer3m: { mean: 18.6, sd: 7.5 } as StatValue, // s per 3m length
  primeSuctionHoseFromTank: { mean: 23.5, sd: 15.3 } as StatValue,
  secureSuctionForOpenWaterDrop: { mean: 97.7, sd: 54.4 } as StatValue,
  lowerSuctionHoseToOpenWaterAndPrime: { mean: 60.7, sd: 37.9 } as StatValue,
};

// ---------------------------------------------------------------------------
// Table Y — Times for search and rescue
// ---------------------------------------------------------------------------
export const TABLE_Y = {
  /** Secondary search rate, m² per second. */
  secondarySearch: { mean: 0.16, sd: 0.05, p10: 0.1 } as StatValue & { p10: number },
  /** Rate to remove/rescue a person, m/s. */
  removeRescuePerson: { mean: 0.05, sd: 0.03 } as StatValue,
  /** Primary search speed reuses Table Q3 (turnout uniform in BA). */
  primarySearch: TABLE_Q.turnoutUniformInBA,
};

// ---------------------------------------------------------------------------
// Table Z — Time to set up aerial equipment
// ---------------------------------------------------------------------------
export type AerialApplianceType = "teleboom" | "ttLadder" | "platform";
export const TABLE_Z = {
  positionAerialAppliance: { mean: 0.54, sd: 0.32 } as StatValue, // m/s
  setupInPreparationForUse: {
    teleboom: { mean: 56.6, sd: 17.6 } as StatValue,
    ttLadder: { mean: 292.0, sd: 222.1 } as StatValue,
    platform: { mean: 145.9, sd: 59.4 } as StatValue,
  } satisfies Record<AerialApplianceType, StatValue>,
  conductSafetyProcedures: { mean: 62.9, sd: 33.7 } as StatValue,
  elevateAndManoeuvre180: {
    teleboom: { mean: 0.11, sd: 0.04 } as StatValue,
    ttLadder: { mean: 0.18, sd: 0.09 } as StatValue,
    platform: { mean: 0.12, sd: 0.05 } as StatValue,
  } satisfies Record<AerialApplianceType, StatValue>,
  chargeMonitor: { mean: 31.5, sd: 25.0 } as StatValue,
};
