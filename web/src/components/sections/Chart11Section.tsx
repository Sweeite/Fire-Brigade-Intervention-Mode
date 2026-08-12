"use client";

import type { Chart11FormState } from "@/lib/formState";
import { ConditionalBlock, FieldRow, NumberField, Section, SelectField, ToggleField } from "@/components/ui/fields";

export function Chart11Section({
  value,
  onChange,
}: {
  value: Chart11FormState;
  onChange: (v: Chart11FormState) => void;
}) {
  const set = <K extends keyof Chart11FormState>(key: K, v: Chart11FormState[K]) => onChange({ ...value, [key]: v });

  return (
    <Section
      title="Chart 11 — Water supply requirements"
      description="Optional. Only needed when additional water beyond Chart 10's initial firefighter protection is required, to support prolonged search & rescue, fire control, exposure protection and extinguishment."
    >
      <ToggleField
        label="Additional water supply required?"
        hint="If off, this chart is skipped entirely and contributes nothing to Chart 10."
        value={value.enabled}
        onChange={(v) => set("enabled", v)}
      />

      <ConditionalBlock show={!value.enabled}>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Chart 11 will be skipped — Chart 10&apos;s result will not include a water-supply-requirements component.
        </span>
      </ConditionalBlock>

      <ConditionalBlock show={value.enabled}>
        <ToggleField
          label="Is hydrant flow/pressure adequate on site?"
          hint="This MVP only supports the 'adequate' (on) path. Turning this off produces an 'unsupported' warning result rather than a computed duration — the source material never worked out a calculation for the off-site/inadequate-supply branch."
          value={value.hydrantSupplyAdequateOnSite}
          onChange={(v) => set("hydrantSupplyAdequateOnSite", v)}
        />

        <ToggleField
          label="Hydrant to appliance"
          hint="Remove, connect & charge hose from hydrant to appliance."
          value={value.hydrantToApplianceEnabled}
          onChange={(v) => set("hydrantToApplianceEnabled", v)}
        />
        <ConditionalBlock show={value.hydrantToApplianceEnabled}>
          <SelectField
            label="Hose diameter"
            value={String(value.hydrantToApplianceDiameter) as "90" | "65"}
            onChange={(v) => set("hydrantToApplianceDiameter", Number(v) as 90 | 65)}
            options={[
              { value: "90", label: "90mm" },
              { value: "65", label: "65mm" },
            ]}
          />
        </ConditionalBlock>

        <ToggleField
          label="Appliance to branch"
          hint="Remove & connect hose from appliance to branch."
          value={value.applianceToBranchEnabled}
          onChange={(v) => set("applianceToBranchEnabled", v)}
        />
        <ConditionalBlock show={value.applianceToBranchEnabled}>
          <SelectField
            label="Hose diameter"
            value={String(value.applianceToBranchDiameter) as "65" | "38"}
            onChange={(v) => set("applianceToBranchDiameter", Number(v) as 65 | 38)}
            options={[
              { value: "65", label: "65mm" },
              { value: "38", label: "38mm" },
            ]}
          />
        </ConditionalBlock>

        <ToggleField
          label="Appliance to booster"
          hint="Remove & connect hose from appliance to booster connections. Dataset only defines a 65mm variant."
          value={value.applianceToBoosterEnabled}
          onChange={(v) => set("applianceToBoosterEnabled", v)}
        />

        <ToggleField
          label="Charge delivery hose"
          hint="Charge delivery hose from appliance."
          value={value.chargeDeliveryHoseEnabled}
          onChange={(v) => set("chargeDeliveryHoseEnabled", v)}
        />
        <ConditionalBlock show={value.chargeDeliveryHoseEnabled}>
          <SelectField
            label="Hose diameter"
            value={String(value.chargeDeliveryHoseDiameter) as "65" | "38"}
            onChange={(v) => set("chargeDeliveryHoseDiameter", Number(v) as 65 | 38)}
            options={[
              { value: "65", label: "65mm" },
              { value: "38", label: "38mm" },
            ]}
          />
        </ConditionalBlock>

        <ToggleField
          label="Connect boosted hydrant and charge"
          hint="Connect hose to boosted hydrant and charge."
          value={value.connectBoostedEnabled}
          onChange={(v) => set("connectBoostedEnabled", v)}
        />
        <ConditionalBlock show={value.connectBoostedEnabled}>
          <SelectField
            label="Hose diameter"
            value={String(value.connectBoostedDiameter) as "65" | "38"}
            onChange={(v) => set("connectBoostedDiameter", Number(v) as 65 | 38)}
            options={[
              { value: "65", label: "65mm" },
              { value: "38", label: "38mm" },
            ]}
          />
        </ConditionalBlock>

        <FieldRow>
          <NumberField
            label="Additional reinforcing-resources time (s)"
            hint="Precomputed reinforcing-appliance dispatch time. Recursive Chart 2-4/11/13 dispatch is out of MVP scope to compute automatically — supply a value if you have one, or leave at 0."
            value={value.additionalResourcesSeconds}
            onChange={(v) => set("additionalResourcesSeconds", v)}
          />
          <NumberField
            label="Target percentile"
            hint="Defaults to 90 — the Manual's worked example and the DDFE calculator's default."
            value={value.percentile}
            onChange={(v) => set("percentile", v)}
          />
        </FieldRow>
      </ConditionalBlock>
    </Section>
  );
}
