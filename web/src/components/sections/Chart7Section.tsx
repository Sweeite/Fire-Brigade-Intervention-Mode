"use client";

import type { Chart7FormState } from "@/lib/formState";
import { ConditionalBlock, FieldRow, NumberField, Section, SelectField, ToggleField } from "@/components/ui/fields";

export function Chart7Section({
  value,
  onChange,
}: {
  value: Chart7FormState;
  onChange: (v: Chart7FormState) => void;
}) {
  const set = <K extends keyof Chart7FormState>(key: K, v: Chart7FormState[K]) => onChange({ ...value, [key]: v });

  return (
    <Section
      title="Chart 7 — Assess fire"
      description="Time for the Officer in Charge (OIC) to survey the fire/building and form a hazard assessment — priced as the time spent physically travelling to gather that information, not the judgement itself."
    >
      <ToggleField
        label="Fire location/extent obvious without reconnaissance?"
        hint="If on, the OIC survey below is skipped entirely (0s) — only additional resources still matter."
        value={value.obviousWithoutReconnaissance}
        onChange={(v) => set("obviousWithoutReconnaissance", v)}
      />

      <ConditionalBlock show={value.obviousWithoutReconnaissance}>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Fire obvious without reconnaissance — OIC survey skipped.
        </span>
      </ConditionalBlock>

      <ConditionalBlock show={!value.obviousWithoutReconnaissance}>
        <SelectField
          label="Building height"
          value={value.buildingHeight}
          onChange={(v) => set("buildingHeight", v)}
          options={[
            { value: "threeStoreysOrLess", label: "Three storeys or less" },
            { value: "greaterThanThreeStoreys", label: "Greater than three storeys" },
          ]}
        />

        <ConditionalBlock show={value.buildingHeight === "threeStoreysOrLess"}>
          <NumberField
            label="Perimeter walk distance (m)"
            hint="Total to-and-from walking distance for the OIC's circuit of the fire-affected area's perimeter, out from and back to the set-up area (outside the building)."
            value={value.perimeterWalkDistanceMetres}
            onChange={(v) => set("perimeterWalkDistanceMetres", v)}
          />
        </ConditionalBlock>

        <ConditionalBlock show={value.buildingHeight === "greaterThanThreeStoreys"}>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Set-up area is inside the building, 1&ndash;2 floors below the fire compartment. The OIC travels three
            legs to survey the fire floor and return.
          </span>
          <FieldRow>
            <NumberField
              label="Leg 1: set-up area to one floor below fire (horizontal m)"
              value={value.leg1HorizontalM}
              onChange={(v) => set("leg1HorizontalM", v)}
            />
            <NumberField
              label="Leg 1: storeys down"
              value={value.leg1StoreysDown}
              onChange={(v) => set("leg1StoreysDown", v)}
            />
          </FieldRow>
          <NumberField
            label="Leg 2: survey the fire floor (storeys up, one floor below to one floor above)"
            value={value.leg2StoreysUp}
            onChange={(v) => set("leg2StoreysUp", v)}
          />
          <FieldRow>
            <NumberField
              label="Leg 3: back to set-up area (horizontal m)"
              value={value.leg3HorizontalM}
              onChange={(v) => set("leg3HorizontalM", v)}
            />
            <NumberField
              label="Leg 3: storeys down"
              value={value.leg3StoreysDown}
              onChange={(v) => set("leg3StoreysDown", v)}
            />
          </FieldRow>
        </ConditionalBlock>
      </ConditionalBlock>

      <ToggleField
        label="Additional resources required?"
        hint="Adds a flat 30s for the fire brigade to notify dispatch via radio, regardless of the survey branch above."
        value={value.additionalResourcesRequired}
        onChange={(v) => set("additionalResourcesRequired", v)}
      />
    </Section>
  );
}
