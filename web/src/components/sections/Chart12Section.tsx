"use client";

import type { FirefighterGear } from "fbim-engine";
import type { Chart12FormState } from "@/lib/formState";
import { ConditionalBlock, FieldRow, NumberField, Section, SelectField, ToggleField } from "@/components/ui/fields";

const GEAR_OPTIONS: { value: FirefighterGear; label: string }[] = [
  { value: "turnoutUniform", label: "Turnout uniform" },
  { value: "turnoutUniformWithEquipment", label: "Turnout uniform with equipment" },
  { value: "turnoutUniformInBA", label: "Turnout uniform in BA" },
  { value: "hazIncidentSuitInBA", label: "Hazmat incident suit in BA" },
];

export function Chart12Section({
  value,
  onChange,
}: {
  value: Chart12FormState;
  onChange: (v: Chart12FormState) => void;
}) {
  const set = <K extends keyof Chart12FormState>(key: K, v: Chart12FormState[K]) => onChange({ ...value, [key]: v });

  return (
    <Section
      title="Chart 12 — Search and rescue"
      description="Time to search smoke-logged areas and rescue trapped occupants, once safety equipment/water is set up."
    >
      <ToggleField
        label="⚠ Have firefighter safety limits been exceeded in the enclosure?"
        hint="⚠ Safety-critical gate: if on, search & rescue is BLOCKED entirely — no duration is computed (possible loss of life or property)."
        value={value.safetyLimitsExceededBeforeSearch}
        onChange={(v) => set("safetyLimitsExceededBeforeSearch", v)}
      />
      <ToggleField
        label="⚠ Have firefighter safety limits been exceeded during search?"
        hint="⚠ Safety-critical gate: if on, search & rescue is BLOCKED entirely — no duration is computed (possible loss of life or property)."
        value={value.safetyLimitsExceededDuringSearch}
        onChange={(v) => set("safetyLimitsExceededDuringSearch", v)}
      />

      <NumberField
        label="Primary search distance (m)"
        hint="Immediate, systematic search near the fire, at ordinary (clear/light-smoke) travel speed."
        value={value.primarySearchDistanceM}
        onChange={(v) => set("primarySearchDistanceM", v)}
      />

      <ToggleField
        label="Secondary search required?"
        hint="Thorough investigation of every compartment where occupants may need rescue."
        value={value.secondarySearchEnabled}
        onChange={(v) => set("secondarySearchEnabled", v)}
      />
      <ConditionalBlock show={value.secondarySearchEnabled}>
        <SelectField
          label="Secondary search method"
          value={value.secondaryMethod}
          onChange={(v) => set("secondaryMethod", v)}
          options={[
            { value: "perimeter", label: "Perimeter (walk the walls)" },
            { value: "area", label: "Area (floor area / search teams)" },
          ]}
        />
        <ConditionalBlock show={value.secondaryMethod === "perimeter"}>
          <NumberField
            label="Perimeter walk distance (m)"
            value={value.secondaryDistanceM}
            onChange={(v) => set("secondaryDistanceM", v)}
          />
        </ConditionalBlock>
        <ConditionalBlock show={value.secondaryMethod === "area"}>
          <FieldRow>
            <NumberField
              label="Floor area to search (m²)"
              value={value.secondaryAreaSqm}
              onChange={(v) => set("secondaryAreaSqm", v)}
            />
            <NumberField
              label="Search teams available"
              hint="Split in half for crew rotation/fatigue management, per the Manual."
              value={value.secondaryTeams}
              onChange={(v) => set("secondaryTeams", v)}
            />
          </FieldRow>
        </ConditionalBlock>
      </ConditionalBlock>

      <ToggleField
        label="Reconnaissance of adjacent enclosures required?"
        hint="Visual check only, not a full search technique."
        value={value.reconnaissanceEnabled}
        onChange={(v) => set("reconnaissanceEnabled", v)}
      />
      <ConditionalBlock show={value.reconnaissanceEnabled}>
        <FieldRow>
          <NumberField
            label="Reconnaissance distance (m)"
            value={value.reconDistanceM}
            onChange={(v) => set("reconDistanceM", v)}
          />
          <SelectField
            label="Gear during reconnaissance"
            value={value.reconGear}
            onChange={(v) => set("reconGear", v)}
            options={GEAR_OPTIONS}
          />
        </FieldRow>
      </ConditionalBlock>
    </Section>
  );
}
