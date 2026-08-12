// Quickstart example — run against the built engine.
//
//   npm install
//   npm run build
//   node examples/quickstart.mjs
//
// This wires up a plausible (fictional) scenario across all 12 implemented
// charts and prints the resulting timeline. It's meant as a template: copy
// this file and edit the inputs to match a real project.

import { runFbimEngine } from "../dist/index.js";

const result = runFbimEngine({
  chart1: {
    automaticDetectionOrSuppressionInstalled: true,
    automaticActivationSeconds: 15, // from an external detection-time calculation
    sprinklers: { systemType: "combinedOHIUnder1000sqm" },
    brigadeConnection: { method: "direct" }, // automatic, direct connection to the brigade
  },
  chart2: {
    callReceivedVerbally: false, // automatic/electronic detection connection
    dispatchRelay: { method: "fullyElectronicCAD" },
  },
  chart3: { stationStaffedFullTime: true, firefightersAlreadyInStation: true },
  chart4: {
    // Google-Maps-sourced travel time samples to the second-closest station
    // (Manual, Chart 4 note 2 — Tuesday/Friday/Saturday x 08:30/12:00/17:00/23:00).
    samples: [
      { dayOfWeek: "Tuesday", timeOfDay: "08:30", rangeMinMinutes: 5, rangeMaxMinutes: 12 },
      { dayOfWeek: "Tuesday", timeOfDay: "17:00", rangeMinMinutes: 6, rangeMaxMinutes: 14 },
      { dayOfWeek: "Friday", timeOfDay: "12:00", rangeMinMinutes: 4, rangeMaxMinutes: 9 },
      { dayOfWeek: "Saturday", timeOfDay: "23:00", rangeMinMinutes: 4, rangeMaxMinutes: 7 },
    ],
  },
  chart6: {
    toolsRequired: ["hydrantEquipment"],
  },
  chart5: (donSafetyEquipmentSeconds) => ({
    siteRoadTravel: { distanceKm: 0.1 },
    fireVisibleOnArrival: false,
    premisesOccupied: true,
    fireWardenPresent: true,
    donSafetyEquipmentSeconds,
    entry: { forcedEntryRequired: false, doors: [{ type: "inwardSideHungDoor", count: 1, method: "key" }] },
    floorAreaSqm: 2500,
    preFirePlanning: {
      documented: true,
      travelToTarget: { horizontal: { distanceMetres: 25, gear: "turnoutUniform" } },
    },
  }),
  chart7: {
    obviousWithoutReconnaissance: false,
    survey: { buildingHeight: "threeStoreysOrLess", perimeterWalkDistanceMetres: 40 },
  },
  chart8: (donSafetyEquipmentSeconds) => ({
    setUpArea: {
      location: "insideBuilding",
      travel: { horizontal: { distanceMetres: 15, gear: "turnoutUniformWithEquipment" } },
      buildingEvacuated: true,
    },
    safetyEquipmentAlreadyDonned: false,
    donSafetyEquipmentSeconds,
  }),
  chart11: {
    hydrantSupplyAdequateOnSite: true,
    segments: {
      hydrantToAppliance: { diameterMm: 65 },
      applianceToBranch: { diameterMm: 65 },
      chargeDeliveryHose: { diameterMm: 65 },
    },
  },
  chart10: (waterSupplyRequirementsSeconds) => ({
    fireAttackFromAppliance: { applianceRepositionDistanceMetres: 10 },
    waterSupplyRequirementsSeconds,
    travelToFireArea: {
      horizontal: { distanceMetres: 20, gear: "turnoutUniformInBA" },
      vertical: { mode: "stairs", storeysUp: 2, storeysDown: 0, hoseLoad: "hose65mm" },
    },
  }),
  chart12: {
    safetyLimitsExceededBeforeSearch: false,
    primarySearch: { horizontalDistanceMetres: 20 },
    secondarySearch: { method: "area", areaSqm: 200, searchTeamsAvailable: 2 },
  },
});

console.log("=== FBIM timeline ===\n");
for (const entry of result.timeline) {
  const mm = Math.floor(entry.cumulativeSeconds / 60);
  const ss = Math.round(entry.cumulativeSeconds % 60).toString().padStart(2, "0");
  console.log(`  +${entry.activitySeconds.toFixed(1).padStart(7)}s  ->  ${mm}:${ss}  ${entry.label}`);
}

console.log(`\nTotal: ${result.totalSeconds.toFixed(1)}s (${result.totalMinutes.toFixed(2)} min)`);

if (result.warnings.length > 0) {
  console.log("\nWarnings:");
  for (const w of result.warnings) console.log(`  - ${w}`);
}

if (result.searchAndRescueBlocked) {
  console.log(`\nSearch & rescue BLOCKED: ${result.searchAndRescueBlocked.reason}`);
}
