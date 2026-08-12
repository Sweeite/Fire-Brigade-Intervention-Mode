import { describe, expect, it } from "vitest";
import { runFbimEngine, type FbimEngineInput } from "../src/engine.js";

function baseInput(): FbimEngineInput {
  return {
    chart1: {
      automaticDetectionOrSuppressionInstalled: true,
      automaticActivationSeconds: 20,
      sprinklers: { systemType: "as2118.1" },
      brigadeConnection: { method: "direct" },
    },
    chart2: {
      callReceivedVerbally: false,
      dispatchRelay: { method: "fullyElectronicCAD" },
    },
    chart3: { stationStaffedFullTime: true, firefightersAlreadyInStation: true },
    chart4: {
      samples: [
        { dayOfWeek: "Tuesday", timeOfDay: "08:30", rangeMinMinutes: 5, rangeMaxMinutes: 10 },
        { dayOfWeek: "Saturday", timeOfDay: "23:00", rangeMinMinutes: 4, rangeMaxMinutes: 7 },
      ],
    },
    chart6: {},
    chart5: () => ({ fireVisibleOnArrival: true }),
    chart7: { obviousWithoutReconnaissance: true },
    chart8: () => ({
      setUpArea: { location: "outsideBuilding" },
      safetyEquipmentAlreadyDonned: true,
    }),
    chart11: {
      hydrantSupplyAdequateOnSite: true,
      segments: { hydrantToAppliance: { diameterMm: 65 } },
    },
    chart10: (waterSupplyRequirementsSeconds) => ({
      fireAttackFromAppliance: false,
      waterSupplyRequirementsSeconds,
      travelToFireArea: { horizontal: { distanceMetres: 10, gear: "turnoutUniform" } },
    }),
    chart12: {
      safetyLimitsExceededBeforeSearch: false,
      primarySearch: { horizontalDistanceMetres: 15 },
    },
  };
}

describe("runFbimEngine — end to end", () => {
  it("produces a consistent, monotonically increasing timeline through search & rescue", () => {
    const result = runFbimEngine(baseInput());

    expect(result.warnings).toEqual([]);
    expect(result.searchAndRescueBlocked).toBeUndefined();
    expect(result.timeline.length).toBe(9); // charts 1,2,3,4,5,7,8,10,12

    let prevCumulative = 0;
    for (const entry of result.timeline) {
      expect(entry.activitySeconds).toBeGreaterThanOrEqual(0);
      expect(entry.cumulativeSeconds).toBeCloseTo(prevCumulative + entry.activitySeconds, 5);
      prevCumulative = entry.cumulativeSeconds;
    }

    expect(result.totalSeconds).toBeCloseTo(prevCumulative, 5);
    expect(result.totalMinutes).toBeCloseTo(result.totalSeconds / 60, 5);

    // Chart 11 was requested and supported, so its result should have been
    // threaded into Chart 10's total (i.e. Chart 10 > just the travel leg).
    expect(result.charts.chart11.status).toBe("computed");
    const travelOnly = 10 / 1.0; // rough lower bound, not exact — just confirms water-supply time was added on top
    expect(result.charts.chart10.seconds).toBeGreaterThan(travelOnly);
  });

  it("stops the timeline at Chart 10 and flags a warning when search & rescue is blocked", () => {
    const input = baseInput();
    input.chart12 = {
      safetyLimitsExceededBeforeSearch: true,
      primarySearch: { horizontalDistanceMetres: 15 },
    };

    const result = runFbimEngine(input);

    expect(result.searchAndRescueBlocked).toBeDefined();
    expect(result.warnings.some((w) => w.includes("Search and rescue blocked"))).toBe(true);
    expect(result.timeline.length).toBe(8); // charts 1,2,3,4,5,7,8,10 only — no chart 12 entry
  });

  it("flags a warning (but still completes) when Chart 11 is requested but unsupported", () => {
    const input = baseInput();
    input.chart11 = { hydrantSupplyAdequateOnSite: false, segments: {} };

    const result = runFbimEngine(input);

    expect(result.warnings.some((w) => w.includes("Chart 11"))).toBe(true);
    expect(result.charts.chart11.status).toBe("unsupported");
    // Chart 10 should still compute — just without a water-supply-requirements addend.
    expect(result.charts.chart10.seconds).toBeGreaterThanOrEqual(0);
  });

  it("includes Chart 3 in the total — fixing the DDFE source's omission of it from the final sum", () => {
    const result = runFbimEngine(baseInput());
    const chart3Entry = result.timeline.find((e) => e.label.includes("Chart 3"));
    expect(chart3Entry).toBeDefined();
    expect(chart3Entry!.activitySeconds).toBeGreaterThan(0);
  });
});
