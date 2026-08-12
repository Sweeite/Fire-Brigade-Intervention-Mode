/**
 * Statistical combination of activity times — AFAC FBIM Manual Section 3.3
 * "Calculation method".
 *
 * Rule (quoted from the Manual): to combine sequential activities, add the
 * individual means to get an overall mean; add the individual variances
 * (sd^2) to get an overall variance; take the square root of the overall
 * variance for the overall standard deviation. Using the mean alone
 * corresponds to the 50th percentile; a design percentile (commonly 90%) is
 * obtained via a Chebyshev's-rule k-factor:
 *
 *   k = sqrt(100 / (100 - x))   for target percentile x
 *
 *   result = mean + k * sqrt(variance)
 *
 * Table 3.1 in the Manual gives representative x/k pairs, reproduced below.
 * This engine computes k directly from the formula rather than
 * interpolating the table, since the formula is exact and the table is
 * just a set of worked values of it.
 */

import type { StatValue } from "../types.js";

/** Table 3.1 worked x/k pairs, for reference/display purposes only — the
 * engine always computes k directly via `kFactorForPercentile`. */
export const TABLE_3_1_PERCENTILE_K_FACTORS: Record<number, number> = {
  75: 2.0,
  80: 2.23,
  85: 2.59,
  90: 3.17,
  95: 4.47,
  99: 10.0,
};

/** k = sqrt(100 / (100 - x)), the Chebyshev's-rule k-factor for a target
 * percentile x (0 < x < 100). */
export function kFactorForPercentile(percentile: number): number {
  if (!(percentile > 0 && percentile < 100)) {
    throw new Error(`percentile must be strictly between 0 and 100, got ${percentile}`);
  }
  return Math.sqrt(100 / (100 - percentile));
}

/** Combines two independent StatValues by summing means and variances
 * (NOT standard deviations — see the Manual's explicit footnote example:
 * 2+2=4, but sqrt(2^2+2^2)=sqrt(8)~=2.828). */
export function combine(a: StatValue, b: StatValue): StatValue {
  const variance = a.sd * a.sd + b.sd * b.sd;
  return { mean: a.mean + b.mean, sd: Math.sqrt(variance) };
}

/** Combines any number of independent StatValues (e.g. every shaded box
 * along a chart's chosen path) into one overall StatValue. */
export function combineAll(values: StatValue[]): StatValue {
  const mean = values.reduce((sum, v) => sum + v.mean, 0);
  const variance = values.reduce((sum, v) => sum + v.sd * v.sd, 0);
  return { mean, sd: Math.sqrt(variance) };
}

/** Resolves a StatValue to a single design duration at the given target
 * percentile: mean + k * sd. Percentile defaults to 90, the value the
 * Manual's worked example and the DDFE calculator both default to. */
export function resolveAtPercentile(value: StatValue, percentile = 90): number {
  return value.mean + kFactorForPercentile(percentile) * value.sd;
}
