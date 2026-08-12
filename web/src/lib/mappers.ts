import type {
  BrigadeConnection,
  Chart1Input,
  Chart2Input,
  Chart3Input,
  Chart4Input,
  Chart5Input,
  Chart6Input,
  Chart7Input,
  Chart8Input,
  Chart10Input,
  Chart11Input,
  Chart12Input,
  DispatchRelayMethod,
  FbimEngineInput,
  FirefighterGear,
  StairHoseLoad,
  TravelInput,
} from "fbim-engine";
import type {
  Chart1FormState,
  Chart2FormState,
  Chart3FormState,
  Chart4FormState,
  Chart5FormState,
  Chart6FormState,
  Chart7FormState,
  Chart8FormState,
  Chart10FormState,
  Chart11FormState,
  Chart12FormState,
  FbimFormState,
} from "./formState";

/** Shared by Chart 8, Chart 10 and Chart 12's reconnaissance leg — all use
 * the same "distance + gear, optional stairs" shape in the form state. */
function travelInputFrom(
  distanceM: number,
  gear: FirefighterGear,
  verticalEnabled: boolean,
  storeysUp: number,
  storeysDown: number,
  hoseLoad: StairHoseLoad,
): TravelInput {
  return {
    horizontal: distanceM > 0 ? { distanceMetres: distanceM, gear } : undefined,
    vertical: verticalEnabled ? { mode: "stairs", storeysUp, storeysDown, hoseLoad } : undefined,
  };
}

function buildChart1Input(s: Chart1FormState): Chart1Input {
  const brigadeConnection: BrigadeConnection =
    s.brigadeConnectionMethod === "direct"
      ? { method: "direct" }
      : s.brigadeConnectionMethod === "intermediateMonitoring"
        ? { method: "intermediateMonitoring", notificationDelaySeconds: s.brigadeConnectionSeconds }
        : s.brigadeConnectionMethod === "telephone"
          ? { method: "telephone", dialConnectionDelaySeconds: s.brigadeConnectionSeconds }
          : { method: "specialOption", delaySeconds: s.brigadeConnectionSeconds };

  return {
    automaticDetectionOrSuppressionInstalled: s.automaticDetectionOrSuppressionInstalled,
    automaticActivationSeconds: s.automaticActivationSeconds,
    sprinklers: s.hasSprinklers ? { systemType: s.sprinklerSystemType } : undefined,
    manualDetection:
      s.manualDetectionVia === "none"
        ? undefined
        : { via: s.manualDetectionVia, timeToVerifyFireSeconds: s.timeToVerifyFireSeconds },
    brigadeConnection,
  };
}

function buildChart2Input(s: Chart2FormState): Chart2Input {
  const dispatchRelay: DispatchRelayMethod =
    s.dispatchRelayMethod === "special"
      ? { method: "special", seconds: s.specialDispatchSeconds }
      : { method: s.dispatchRelayMethod };
  return { callReceivedVerbally: s.callReceivedVerbally, dispatchRelay };
}

function buildChart3Input(s: Chart3FormState): Chart3Input {
  return s.stationStaffedFullTime
    ? { stationStaffedFullTime: true, firefightersAlreadyInStation: s.firefightersAlreadyInStation }
    : { stationStaffedFullTime: false };
}

function buildChart4Input(s: Chart4FormState): Chart4Input {
  return { samples: s.samples };
}

function buildChart6Input(s: Chart6FormState): Chart6Input {
  return {
    hazmatSuitRequired: s.hazmatSuitRequired,
    safetyProcedures: s.safetyProcedures,
    toolsRequired: s.toolsRequired,
    percentile: s.percentile,
  };
}

function buildChart5Input(s: Chart5FormState, donSafetyEquipmentSeconds: number): Chart5Input {
  const common = s.siteRoadTravelKm > 0 ? { siteRoadTravel: { distanceKm: s.siteRoadTravelKm } } : {};

  if (s.fireVisibleOnArrival) {
    return { ...common, fireVisibleOnArrival: true };
  }

  return {
    ...common,
    fireVisibleOnArrival: false,
    premisesOccupied: s.premisesOccupied,
    fireWardenPresent: s.fireWardenPresent,
    donSafetyEquipmentSeconds,
    entry: {
      forcedEntryRequired: s.forcedEntryRequired,
      doors:
        s.doorCount > 0
          ? [{ type: s.doorType, count: s.doorCount, method: s.forcedEntryRequired ? "force" : "key" }]
          : [],
    },
    floorAreaSqm: s.floorAreaSqm,
    hindrance: s.hindranceEnabled ? { level: s.hindranceLevel } : undefined,
    securityProcedureSeconds: s.securityProcedureSeconds,
    preFirePlanning: s.preFirePlanningDocumented
      ? {
          documented: true,
          travelToTarget: { horizontal: { distanceMetres: s.travelToTargetDistanceM, gear: s.travelToTargetGear } },
        }
      : { documented: false, wayFindingComplexity: s.wayFindingComplexity },
  };
}

function buildChart7Input(s: Chart7FormState): Chart7Input {
  if (s.obviousWithoutReconnaissance) {
    return { obviousWithoutReconnaissance: true, additionalResourcesRequired: s.additionalResourcesRequired };
  }

  const survey =
    s.buildingHeight === "threeStoreysOrLess"
      ? { buildingHeight: "threeStoreysOrLess" as const, perimeterWalkDistanceMetres: s.perimeterWalkDistanceMetres }
      : {
          buildingHeight: "greaterThanThreeStoreys" as const,
          legs: {
            setUpAreaToFloorBelowFire: { horizontalDistanceMetres: s.leg1HorizontalM, storeysDown: s.leg1StoreysDown },
            floorBelowToFloorAboveFire: { storeysUp: s.leg2StoreysUp },
            backToSetUpArea: { horizontalDistanceMetres: s.leg3HorizontalM, storeysDown: s.leg3StoreysDown },
          },
        };

  return { obviousWithoutReconnaissance: false, survey, additionalResourcesRequired: s.additionalResourcesRequired };
}

function buildChart8Input(s: Chart8FormState, donSafetyEquipmentSeconds: number): Chart8Input {
  const roadTravel = s.roadTravelEnabled
    ? { distanceKm: s.roadTravelDistanceKm, securityProcedureSeconds: s.securityProcedureSeconds }
    : undefined;

  const travel = travelInputFrom(s.travelDistanceM, s.travelGear, s.travelVerticalEnabled, s.storeysUp, s.storeysDown, s.hoseLoad);

  const setUpArea =
    s.setUpAreaLocation === "outsideBuilding"
      ? ({ location: "outsideBuilding" as const })
      : s.buildingEvacuated
        ? ({ location: "insideBuilding" as const, travel, buildingEvacuated: true as const })
        : ({
            location: "insideBuilding" as const,
            travel,
            buildingEvacuated: false as const,
            hindranceLevel: s.hindranceLevel,
          });

  return s.safetyEquipmentAlreadyDonned
    ? { roadTravel, setUpArea, safetyEquipmentAlreadyDonned: true }
    : { roadTravel, setUpArea, safetyEquipmentAlreadyDonned: false, donSafetyEquipmentSeconds };
}

function buildChart11Input(s: Chart11FormState): Chart11Input | undefined {
  if (!s.enabled) return undefined;
  return {
    hydrantSupplyAdequateOnSite: s.hydrantSupplyAdequateOnSite,
    segments: {
      hydrantToAppliance: s.hydrantToApplianceEnabled ? { diameterMm: s.hydrantToApplianceDiameter } : undefined,
      applianceToBranch: s.applianceToBranchEnabled ? { diameterMm: s.applianceToBranchDiameter } : undefined,
      applianceToBooster: s.applianceToBoosterEnabled ? true : undefined,
      chargeDeliveryHose: s.chargeDeliveryHoseEnabled ? { diameterMm: s.chargeDeliveryHoseDiameter } : undefined,
      connectBoostedHydrantAndCharge: s.connectBoostedEnabled ? { diameterMm: s.connectBoostedDiameter } : undefined,
    },
    additionalResourcesSeconds: s.additionalResourcesSeconds,
    percentile: s.percentile,
  };
}

function buildChart10Input(s: Chart10FormState, waterSupplyRequirementsSeconds: number | undefined): Chart10Input {
  return {
    fireAttackFromAppliance: s.fireAttackFromAppliance
      ? { applianceRepositionDistanceMetres: s.applianceRepositionDistanceMetres }
      : false,
    waterSupplyRequirementsSeconds,
    travelToFireArea: travelInputFrom(s.travelDistanceM, s.travelGear, s.travelVerticalEnabled, s.storeysUp, s.storeysDown, s.hoseLoad),
  };
}

function buildChart12Input(s: Chart12FormState): Chart12Input {
  const secondarySearch = !s.secondarySearchEnabled
    ? undefined
    : s.secondaryMethod === "perimeter"
      ? { method: "perimeter" as const, horizontalDistanceMetres: s.secondaryDistanceM }
      : { method: "area" as const, areaSqm: s.secondaryAreaSqm, searchTeamsAvailable: s.secondaryTeams };

  const reconnaissance = s.reconnaissanceEnabled
    ? { horizontal: { distanceMetres: s.reconDistanceM, gear: s.reconGear } }
    : undefined;

  return {
    safetyLimitsExceededBeforeSearch: s.safetyLimitsExceededBeforeSearch,
    safetyLimitsExceededDuringSearch: s.safetyLimitsExceededDuringSearch,
    primarySearch: { horizontalDistanceMetres: s.primarySearchDistanceM },
    secondarySearch,
    reconnaissance,
  };
}

/** Converts the flat UI form state into exactly the shape `runFbimEngine`
 * expects, including the builder-function pattern Charts 5, 8 and 10 use to
 * receive another chart's precomputed result. */
export function buildEngineInput(state: FbimFormState): FbimEngineInput {
  return {
    chart1: buildChart1Input(state.chart1),
    chart2: buildChart2Input(state.chart2),
    chart3: buildChart3Input(state.chart3),
    chart4: buildChart4Input(state.chart4),
    chart6: buildChart6Input(state.chart6),
    chart5: (donSafetyEquipmentSeconds) => buildChart5Input(state.chart5, donSafetyEquipmentSeconds),
    chart7: buildChart7Input(state.chart7),
    chart8: (donSafetyEquipmentSeconds) => buildChart8Input(state.chart8, donSafetyEquipmentSeconds),
    chart11: buildChart11Input(state.chart11),
    chart10: (waterSupplyRequirementsSeconds) => buildChart10Input(state.chart10, waterSupplyRequirementsSeconds),
    chart12: buildChart12Input(state.chart12),
  };
}
