import { describe, expect, it } from "vitest";
import { combine, kFactorForPercentile, resolveAtPercentile, TABLE_3_1_PERCENTILE_K_FACTORS } from "../src/lib/percentile.js";

describe("kFactorForPercentile", () => {
  it("matches the Manual's Table 3.1 worked x/k pairs", () => {
    for (const [percentile, k] of Object.entries(TABLE_3_1_PERCENTILE_K_FACTORS)) {
      expect(kFactorForPercentile(Number(percentile))).toBeCloseTo(k, 1);
    }
  });

  it("rejects percentiles outside (0, 100)", () => {
    expect(() => kFactorForPercentile(0)).toThrow();
    expect(() => kFactorForPercentile(100)).toThrow();
  });
});

describe("Manual Section 3.3 worked example — rolling hose", () => {
  // "If rolling out one length of hose has a mean of 70 seconds and a
  // standard deviation of 34 seconds, then a 90% time is given by
  // 70 + 3.17 x 34 = 178 seconds for this single activity."
  it("single hose length resolves to 178s at the 90th percentile", () => {
    const single = { mean: 70, sd: 34 };
    expect(resolveAtPercentile(single, 90)).toBeCloseTo(178, 0);
  });

  // "...if rolling out two lengths of hose consecutively, then we must add
  // the two means to get a final mean of 70 + 70 = 140 seconds, and add the
  // two variances to get a final variance of 34^2 + 34^2 = 2,312 and take
  // the square root for the final standard deviation of 48 seconds."
  it("two consecutive hose lengths combine to mean 140s, sd ~48.08s", () => {
    const oneLength = { mean: 70, sd: 34 };
    const two = combine(oneLength, oneLength);
    expect(two.mean).toBe(140);
    expect(two.sd).toBeCloseTo(48.08, 1); // sqrt(2312) = 48.0833...
  });

  // "The 90% time is then obtained from 140 + 3.14 x 48 = 291 seconds."
  //
  // Note: the Manual's own worked text uses k=3.17 for the single-activity
  // calculation above but appears to use "3.14" for this second step — this
  // engine always computes k directly from the formula (k = sqrt(100/(100-x))
  // = 3.1698... for x=90), which is the Manual's own stated rule, so this
  // test checks against the *correct* k=3.17 result rather than reproducing
  // what looks like a transcription/rounding slip in the source text. The
  // two results differ by under 1 second (291 vs ~292.3), consistent with
  // that being a minor typo rather than a different intended method.
  it("two consecutive hose lengths resolve to ~292s at the 90th percentile (correct k=3.17, not the source text's apparent 3.14 typo)", () => {
    const oneLength = { mean: 70, sd: 34 };
    const two = combine(oneLength, oneLength);
    const resolved = resolveAtPercentile(two, 90);
    expect(resolved).toBeCloseTo(140 + 3.17 * two.sd, 0);
    expect(resolved).toBeGreaterThan(291);
    expect(resolved).toBeLessThan(293);
  });

  it("explicitly is not double the single-activity time (the Manual's caution)", () => {
    const oneLength = { mean: 70, sd: 34 };
    const two = combine(oneLength, oneLength);
    const resolvedTwo = resolveAtPercentile(two, 90);
    const resolvedSingle = resolveAtPercentile(oneLength, 90);
    expect(resolvedTwo).toBeLessThan(resolvedSingle * 2);
  });
});
