import type {
  DoorType,
  FirefighterGear,
  HindranceLevel,
  SprinklerSystemType,
  StairHoseLoad,
  WayFindingComplexity,
  SafetyProcedureItem,
  ToolItem,
  TravelSample,
  DispatchRelayMethod,
} from "fbim-engine";

/**
 * UI-friendly form state for every chart section, one flat object per
 * chart. These are deliberately simpler than the engine's own input types
 * in a few places (e.g. Chart 5's door negotiation is a single door
 * type/count here, rather than an arbitrary list) — see each section
 * component's comments for exactly what's simplified. `src/lib/mappers.ts`
 * converts each of these into the exact type the corresponding chart
 * function expects.
 */

export interface Chart1FormState {
  automaticDetectionOrSuppressionInstalled: boolean;
  automaticActivationSeconds: number;
  hasSprinklers: boolean;
  sprinklerSystemType: SprinklerSystemType;
  manualDetectionVia: "none" | "occupantCues" | "otherMeans";
  timeToVerifyFireSeconds: number;
  brigadeConnectionMethod: "direct" | "intermediateMonitoring" | "telephone" | "specialOption";
  brigadeConnectionSeconds: number;
}

export interface Chart2FormState {
  callReceivedVerbally: boolean;
  dispatchRelayMethod: DispatchRelayMethod["method"];
  specialDispatchSeconds: number;
}

export interface Chart3FormState {
  stationStaffedFullTime: boolean;
  firefightersAlreadyInStation: boolean;
}

export interface Chart4FormState {
  samples: TravelSample[];
}

export interface Chart6FormState {
  hazmatSuitRequired: boolean;
  safetyProcedures: SafetyProcedureItem[];
  toolsRequired: ToolItem[];
  percentile: number;
}

export interface Chart5FormState {
  siteRoadTravelKm: number;
  fireVisibleOnArrival: boolean;
  premisesOccupied: boolean;
  fireWardenPresent: boolean;
  forcedEntryRequired: boolean;
  doorType: DoorType;
  doorCount: number;
  floorAreaSqm: number;
  hindranceEnabled: boolean;
  hindranceLevel: HindranceLevel;
  securityProcedureSeconds: number;
  preFirePlanningDocumented: boolean;
  travelToTargetDistanceM: number;
  travelToTargetGear: FirefighterGear;
  wayFindingComplexity: WayFindingComplexity;
}

export interface Chart7FormState {
  obviousWithoutReconnaissance: boolean;
  buildingHeight: "threeStoreysOrLess" | "greaterThanThreeStoreys";
  perimeterWalkDistanceMetres: number;
  leg1HorizontalM: number;
  leg1StoreysDown: number;
  leg2StoreysUp: number;
  leg3HorizontalM: number;
  leg3StoreysDown: number;
  additionalResourcesRequired: boolean;
}

export interface Chart8FormState {
  roadTravelEnabled: boolean;
  roadTravelDistanceKm: number;
  securityProcedureSeconds: number;
  safetyEquipmentAlreadyDonned: boolean;
  setUpAreaLocation: "outsideBuilding" | "insideBuilding";
  travelDistanceM: number;
  travelGear: FirefighterGear;
  travelVerticalEnabled: boolean;
  storeysUp: number;
  storeysDown: number;
  hoseLoad: StairHoseLoad;
  buildingEvacuated: boolean;
  hindranceLevel: HindranceLevel;
}

export interface Chart11FormState {
  enabled: boolean;
  hydrantSupplyAdequateOnSite: boolean;
  hydrantToApplianceEnabled: boolean;
  hydrantToApplianceDiameter: 90 | 65;
  applianceToBranchEnabled: boolean;
  applianceToBranchDiameter: 65 | 38;
  applianceToBoosterEnabled: boolean;
  chargeDeliveryHoseEnabled: boolean;
  chargeDeliveryHoseDiameter: 65 | 38;
  connectBoostedEnabled: boolean;
  connectBoostedDiameter: 65 | 38;
  additionalResourcesSeconds: number;
  percentile: number;
}

export interface Chart10FormState {
  fireAttackFromAppliance: boolean;
  applianceRepositionDistanceMetres: number;
  travelDistanceM: number;
  travelGear: FirefighterGear;
  travelVerticalEnabled: boolean;
  storeysUp: number;
  storeysDown: number;
  hoseLoad: StairHoseLoad;
}

export interface Chart12FormState {
  safetyLimitsExceededBeforeSearch: boolean;
  safetyLimitsExceededDuringSearch: boolean;
  primarySearchDistanceM: number;
  secondarySearchEnabled: boolean;
  secondaryMethod: "perimeter" | "area";
  secondaryDistanceM: number;
  secondaryAreaSqm: number;
  secondaryTeams: number;
  reconnaissanceEnabled: boolean;
  reconDistanceM: number;
  reconGear: FirefighterGear;
}

export interface FbimFormState {
  chart1: Chart1FormState;
  chart2: Chart2FormState;
  chart3: Chart3FormState;
  chart4: Chart4FormState;
  chart6: Chart6FormState;
  chart5: Chart5FormState;
  chart7: Chart7FormState;
  chart8: Chart8FormState;
  chart11: Chart11FormState;
  chart10: Chart10FormState;
  chart12: Chart12FormState;
}

/** A worked example (loosely matching engine/examples/quickstart.mjs) so
 * the app opens with a plausible, runnable scenario rather than a wall of
 * empty/zeroed fields. */
export const defaultFormState: FbimFormState = {
  chart1: {
    automaticDetectionOrSuppressionInstalled: true,
    automaticActivationSeconds: 15,
    hasSprinklers: true,
    sprinklerSystemType: "combinedOHIUnder1000sqm",
    manualDetectionVia: "none",
    timeToVerifyFireSeconds: 60,
    brigadeConnectionMethod: "direct",
    brigadeConnectionSeconds: 30,
  },
  chart2: {
    callReceivedVerbally: false,
    dispatchRelayMethod: "fullyElectronicCAD",
    specialDispatchSeconds: 30,
  },
  chart3: { stationStaffedFullTime: true, firefightersAlreadyInStation: true },
  chart4: {
    samples: [
      { dayOfWeek: "Tuesday", timeOfDay: "08:30", rangeMinMinutes: 5, rangeMaxMinutes: 12 },
      { dayOfWeek: "Tuesday", timeOfDay: "17:00", rangeMinMinutes: 6, rangeMaxMinutes: 14 },
      { dayOfWeek: "Friday", timeOfDay: "12:00", rangeMinMinutes: 4, rangeMaxMinutes: 9 },
      { dayOfWeek: "Saturday", timeOfDay: "23:00", rangeMinMinutes: 4, rangeMaxMinutes: 7 },
    ],
  },
  chart6: {
    hazmatSuitRequired: false,
    safetyProcedures: [],
    toolsRequired: ["hydrantEquipment"],
    percentile: 90,
  },
  chart5: {
    siteRoadTravelKm: 0.1,
    fireVisibleOnArrival: false,
    premisesOccupied: true,
    fireWardenPresent: true,
    forcedEntryRequired: false,
    doorType: "inwardSideHungDoor",
    doorCount: 1,
    floorAreaSqm: 2500,
    hindranceEnabled: false,
    hindranceLevel: "low",
    securityProcedureSeconds: 0,
    preFirePlanningDocumented: true,
    travelToTargetDistanceM: 25,
    travelToTargetGear: "turnoutUniform",
    wayFindingComplexity: "singleStoreyOpenPlan",
  },
  chart7: {
    obviousWithoutReconnaissance: false,
    buildingHeight: "threeStoreysOrLess",
    perimeterWalkDistanceMetres: 40,
    leg1HorizontalM: 20,
    leg1StoreysDown: 1,
    leg2StoreysUp: 2,
    leg3HorizontalM: 20,
    leg3StoreysDown: 1,
    additionalResourcesRequired: false,
  },
  chart8: {
    roadTravelEnabled: false,
    roadTravelDistanceKm: 0,
    securityProcedureSeconds: 0,
    safetyEquipmentAlreadyDonned: false,
    setUpAreaLocation: "insideBuilding",
    travelDistanceM: 15,
    travelGear: "turnoutUniformWithEquipment",
    travelVerticalEnabled: false,
    storeysUp: 0,
    storeysDown: 0,
    hoseLoad: "none",
    buildingEvacuated: true,
    hindranceLevel: "low",
  },
  chart11: {
    enabled: true,
    hydrantSupplyAdequateOnSite: true,
    hydrantToApplianceEnabled: true,
    hydrantToApplianceDiameter: 65,
    applianceToBranchEnabled: true,
    applianceToBranchDiameter: 65,
    applianceToBoosterEnabled: false,
    chargeDeliveryHoseEnabled: true,
    chargeDeliveryHoseDiameter: 65,
    connectBoostedEnabled: false,
    connectBoostedDiameter: 65,
    additionalResourcesSeconds: 0,
    percentile: 90,
  },
  chart10: {
    fireAttackFromAppliance: true,
    applianceRepositionDistanceMetres: 10,
    travelDistanceM: 20,
    travelGear: "turnoutUniformInBA",
    travelVerticalEnabled: true,
    storeysUp: 2,
    storeysDown: 0,
    hoseLoad: "hose65mm",
  },
  chart12: {
    safetyLimitsExceededBeforeSearch: false,
    safetyLimitsExceededDuringSearch: false,
    primarySearchDistanceM: 20,
    secondarySearchEnabled: true,
    secondaryMethod: "area",
    secondaryDistanceM: 30,
    secondaryAreaSqm: 200,
    secondaryTeams: 2,
    reconnaissanceEnabled: false,
    reconDistanceM: 10,
    reconGear: "turnoutUniformInBA",
  },
};
