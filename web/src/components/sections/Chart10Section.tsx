"use client";

import type { FirefighterGear, StairHoseLoad } from "fbim-engine";
import type { Chart10FormState } from "@/lib/formState";
import { ConditionalBlock, FieldRow, NumberField, Section, SelectField, ToggleField } from "@/components/ui/fields";

const GEAR_OPTIONS: { value: FirefighterGear; label: string }[] = [
  { value: "turnoutUniform", label: "Turnout uniform" },
  { value: "turnoutUniformWithEquipment", label: "Turnout uniform with equipment" },
  { value: "turnoutUniformInBA", label: "Turnout uniform in BA" },
  { value: "hazIncidentSuitInBA", label: "Hazmat incident suit in BA" },
];

const HOSE_LOAD_OPTIONS: { value: StairHoseLoad; label: string }[] = [
  { value: "none", label: "None" },
  { value: "highPressureHose", label: "High-pressure hose" },
  { value: "hose65mm", label: "65mm hose" },
  { value: "hose38mm", label: "38mm hose" },
];

export function Chart10Section({
  value,
  onChange,
}: {
  value: Chart10FormState;
  onChange: (v: Chart10FormState) => void;
}) {
  const set = <K extends keyof Chart10FormState>(key: K, v: Chart10FormState[K]) => onChange({ ...value, [key]: v });

  return (
    <Section
      title="Chart 10 — Time to set up water (initial firefighter protection)"
      description="Time to establish water for initial firefighter safety, sourced from the appliance (tank + hose reel), before internal fire-related activity begins. If Chart 11 (water supply requirements) below is enabled, its result is automatically added here too — no field needed for that in this section."
    >
      <ToggleField
        label="Fire attack directly from the fire appliance (tank + high-pressure hose reel)?"
        hint="If so, the appliance must first be positioned/repositioned at the appropriate entrance (Table U)."
        value={value.fireAttackFromAppliance}
        onChange={(v) => set("fireAttackFromAppliance", v)}
      />
      <ConditionalBlock show={value.fireAttackFromAppliance}>
        <NumberField
          label="Appliance reposition distance (m)"
          hint="Table U — positioning speed 2 m/s."
          value={value.applianceRepositionDistanceMetres}
          onChange={(v) => set("applianceRepositionDistanceMetres", v)}
        />
      </ConditionalBlock>

      <FieldRow>
        <NumberField
          label="Travel distance from set-up area to fire area (m)"
          value={value.travelDistanceM}
          onChange={(v) => set("travelDistanceM", v)}
        />
        <SelectField
          label="Gear during travel"
          value={value.travelGear}
          onChange={(v) => set("travelGear", v)}
          options={GEAR_OPTIONS}
        />
      </FieldRow>

      <ToggleField
        label="Stairs involved in this travel?"
        value={value.travelVerticalEnabled}
        onChange={(v) => set("travelVerticalEnabled", v)}
      />
      <ConditionalBlock show={value.travelVerticalEnabled}>
        <FieldRow>
          <NumberField label="Storeys up" value={value.storeysUp} onChange={(v) => set("storeysUp", v)} />
          <NumberField label="Storeys down" value={value.storeysDown} onChange={(v) => set("storeysDown", v)} />
        </FieldRow>
        <SelectField
          label="Hose load carried on stairs"
          hint="Table T — determines vertical travel speed."
          value={value.hoseLoad}
          onChange={(v) => set("hoseLoad", v)}
          options={HOSE_LOAD_OPTIONS}
        />
      </ConditionalBlock>
    </Section>
  );
}
