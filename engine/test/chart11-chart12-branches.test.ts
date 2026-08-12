import { describe, expect, it } from "vitest";
import { chart11 } from "../src/charts/chart11.js";
import { chart12 } from "../src/charts/chart12.js";

describe("chart11 — water supply requirements", () => {
  it("returns an explicit 'unsupported' result when on-site hydrant supply is inadequate, rather than a fabricated number", () => {
    const result = chart11({ hydrantSupplyAdequateOnSite: false, segments: {} });
    expect(result.status).toBe("unsupported");
    if (result.status === "unsupported") {
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });

  it("computes a percentile-resolved total from active hose segments when supply is adequate", () => {
    const result = chart11({
      hydrantSupplyAdequateOnSite: true,
      segments: {
        hydrantToAppliance: { diameterMm: 65 },
        applianceToBranch: { diameterMm: 65 },
      },
    });
    expect(result.status).toBe("computed");
    if (result.status === "computed") {
      expect(result.seconds).toBeGreaterThan(0);
    }
  });
});

describe("chart12 — search and rescue", () => {
  it("returns 'blocked' with no duration when firefighter safety limits are exceeded before search", () => {
    const result = chart12({
      safetyLimitsExceededBeforeSearch: true,
      primarySearch: { horizontalDistanceMetres: 20 },
    });
    expect(result.status).toBe("blocked");
    expect((result as { seconds?: number }).seconds).toBeUndefined();
  });

  it("returns 'blocked' when safety limits are exceeded during search, even though primary search distance was supplied", () => {
    const result = chart12({
      safetyLimitsExceededBeforeSearch: false,
      safetyLimitsExceededDuringSearch: true,
      primarySearch: { horizontalDistanceMetres: 20 },
    });
    expect(result.status).toBe("blocked");
  });

  it("completes with a positive duration when not blocked", () => {
    const result = chart12({
      safetyLimitsExceededBeforeSearch: false,
      primarySearch: { horizontalDistanceMetres: 20 },
      secondarySearch: { method: "area", areaSqm: 100, searchTeamsAvailable: 2 },
    });
    expect(result.status).toBe("completed");
    if (result.status === "completed") {
      expect(result.seconds).toBeGreaterThan(0);
    }
  });
});
