/**
 * Chart 11 — Time to set up water supply requirements.
 *
 * Time to establish sufficient water quantity/pressure to support prolonged
 * search & rescue, fire control, exposure protection and extinguishment —
 * i.e. water beyond Chart 10's *initial* firefighter-protection supply.
 * Scoped, per the Manual/dataset, to charged wet hydrant systems.
 *
 * MVP scoping note: the DDFE spreadsheet this is ported from only ever
 * implements the "hydrant flow/pressure IS adequate on site" branch of this
 * chart. DDFE's own developer notes on the "No" (off-site water
 * search / inadequate on-site supply) branch state it "will only be
 * selected in unique circumstances. Calculation has not been carried out
 * for unique cases." This engine follows that same scoping: only the
 * adequate-on-site-supply path is computed. If the caller indicates supply
 * is not adequate on site, `chart11` returns a clearly-flagged "unsupported"
 * result rather than fabricating a calculation for a path the source
 * material never actually worked out.
 *
 * For the supported path, this chart is a statistical combination (like
 * Chart 6): sum the means/variances of every active hose-lay/connect/charge
 * segment (each a StatValue from Table V), then resolve at a target
 * percentile via `combineAll` + `resolveAtPercentile` — the Manual's
 * Section 3.3 method (mean + k*sqrt(variance)).
 */

import { TABLE_V } from "../data/tables.js";
import { combineAll, kFactorForPercentile, resolveAtPercentile } from "../lib/percentile.js";
import type { ChartResult, StatValue } from "../types.js";

export type Chart11Result =
  | ({ status: "computed" } & ChartResult)
  | { status: "unsupported"; reason: string };

export interface Chart11Input {
  /** Is hydrant flow/pressure adequate on site? Per the DDFE source, only
   * `true` is supported by this MVP — see file header. */
  hydrantSupplyAdequateOnSite: boolean;
  segments: {
    /** Remove, connect & charge hose from hydrant to appliance. */
    hydrantToAppliance?: { diameterMm: 90 | 65 };
    /** Remove & connect hose from appliance to branch. */
    applianceToBranch?: { diameterMm: 65 | 38 };
    /** Remove & connect hose from appliance to booster connections.
     * Dataset only defines a 65mm variant for this segment. */
    applianceToBooster?: true;
    /** Charge delivery hose from appliance. */
    chargeDeliveryHose?: { diameterMm: 65 | 38 };
    /** Connect hose to boosted hydrant and charge. */
    connectBoostedHydrantAndCharge?: { diameterMm: 65 | 38 };
  };
  /** Recursive dispatch of reinforcing appliances (Manual: "are additional
   * resources/equipment needed? -> invokes Charts 2-4, 11, 13") is out of
   * scope for this MVP. If the caller has computed this separately, they
   * may pass it here to be added on top; otherwise omit/0. Treated as an
   * already-resolved duration (not combined statistically with the
   * segments above). */
  additionalResourcesSeconds?: number;
  /** Target design percentile for the statistical combination. Defaults to
   * 90 (the Manual's worked example and the DDFE calculator's default). */
  percentile?: number;
}

function hydrantToApplianceValue(diameterMm: 90 | 65): StatValue {
  return diameterMm === 90
    ? TABLE_V.removeConnectChargeHydrantToAppliance90mm
    : TABLE_V.removeConnectChargeHydrantToAppliance65mm;
}

function applianceToBranchValue(diameterMm: 65 | 38): StatValue {
  return diameterMm === 65 ? TABLE_V.removeConnectApplianceToBranch65mm : TABLE_V.removeConnectApplianceToBranch38mm;
}

function chargeDeliveryHoseValue(diameterMm: 65 | 38): StatValue {
  return diameterMm === 65 ? TABLE_V.chargeDeliveryHoseFromAppliance65mm : TABLE_V.chargeDeliveryHoseFromAppliance38mm;
}

function connectBoostedHydrantAndChargeValue(diameterMm: 65 | 38): StatValue {
  return diameterMm === 65 ? TABLE_V.connectBoostedHydrantAndCharge65mm : TABLE_V.connectBoostedHydrantAndCharge38mm;
}

export function chart11(input: Chart11Input): Chart11Result {
  if (!input.hydrantSupplyAdequateOnSite) {
    return {
      status: "unsupported",
      reason:
        "Hydrant flow/pressure not adequate on site (off-site water search / inadequate volume). The DDFE " +
        "source this chart is ported from never carried out a calculation for this branch, describing it as a " +
        "unique circumstance outside its worked model — out of scope for this MVP.",
    };
  }

  const percentile = input.percentile ?? 90;
  const breakdown: ChartResult["breakdown"] = [];
  const components: StatValue[] = [];

  const { segments } = input;

  if (segments.hydrantToAppliance) {
    const value = hydrantToApplianceValue(segments.hydrantToAppliance.diameterMm);
    components.push(value);
    breakdown.push({
      label: `Remove, connect & charge hose from hydrant to appliance (${segments.hydrantToAppliance.diameterMm}mm, mean ${value.mean}s, sd ${value.sd}s)`,
      seconds: value.mean,
    });
  }

  if (segments.applianceToBranch) {
    const value = applianceToBranchValue(segments.applianceToBranch.diameterMm);
    components.push(value);
    breakdown.push({
      label: `Remove & connect hose from appliance to branch (${segments.applianceToBranch.diameterMm}mm, mean ${value.mean}s, sd ${value.sd}s)`,
      seconds: value.mean,
    });
  }

  if (segments.applianceToBooster) {
    const value = TABLE_V.removeConnectApplianceToBooster65mm;
    components.push(value);
    breakdown.push({
      label: `Remove & connect hose from appliance to booster connections (65mm, mean ${value.mean}s, sd ${value.sd}s)`,
      seconds: value.mean,
    });
  }

  if (segments.chargeDeliveryHose) {
    const value = chargeDeliveryHoseValue(segments.chargeDeliveryHose.diameterMm);
    components.push(value);
    breakdown.push({
      label: `Charge delivery hose from appliance (${segments.chargeDeliveryHose.diameterMm}mm, mean ${value.mean}s, sd ${value.sd}s)`,
      seconds: value.mean,
    });
  }

  if (segments.connectBoostedHydrantAndCharge) {
    const value = connectBoostedHydrantAndChargeValue(segments.connectBoostedHydrantAndCharge.diameterMm);
    components.push(value);
    breakdown.push({
      label: `Connect hose to boosted hydrant and charge (${segments.connectBoostedHydrantAndCharge.diameterMm}mm, mean ${value.mean}s, sd ${value.sd}s)`,
      seconds: value.mean,
    });
  }

  const combined = combineAll(components);
  const resolved = resolveAtPercentile(combined, percentile);
  const k = kFactorForPercentile(percentile);

  breakdown.push({
    label: `${percentile}th-percentile result (mean ${combined.mean.toFixed(1)}s + ${k.toFixed(2)} * sd ${combined.sd.toFixed(1)}s)`,
    seconds: resolved,
  });

  const additional = input.additionalResourcesSeconds ?? 0;
  if (additional > 0) {
    breakdown.push({
      label: "Additional reinforcing resources (precomputed elsewhere; recursive Chart 2-4/11/13 dispatch is out of MVP scope)",
      seconds: additional,
    });
  }

  const seconds = resolved + additional;
  return { status: "computed", seconds, breakdown };
}
