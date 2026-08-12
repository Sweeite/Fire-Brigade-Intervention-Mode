import { describe, expect, it } from "vitest";
import { chart6 } from "../src/charts/chart6.js";
import { TABLE_M, TABLE_N } from "../src/data/tables.js";
import { combine, resolveAtPercentile } from "../src/lib/percentile.js";

describe("chart6 — don safety equipment and gather tools", () => {
  it("with only the always-on dismount+BA component, resolves to Table M's own 90th percentile", () => {
    const result = chart6({});
    expect(result.seconds).toBeCloseTo(resolveAtPercentile(TABLE_M, 90), 5);
  });

  it("combines dismount+BA with a hazmat suit per the Manual's variance-summing rule, not sd-summing", () => {
    const result = chart6({ hazmatSuitRequired: true });
    const combined = combine(TABLE_M, TABLE_N);
    expect(result.seconds).toBeCloseTo(resolveAtPercentile(combined, 90), 5);
    // Sanity check this is NOT simple sd addition (Manual's explicit footnote).
    const wrongIfSdSummed = TABLE_M.mean + TABLE_N.mean + 3.17 * (TABLE_M.sd + TABLE_N.sd);
    expect(result.seconds).not.toBeCloseTo(wrongIfSdSummed, 0);
  });

  it("respects a custom percentile — higher target percentile means a longer (more conservative) result", () => {
    const at50 = chart6({ percentile: 50 });
    const at90 = chart6({ percentile: 90 });
    expect(at90.seconds).toBeGreaterThan(at50.seconds);
  });
});
