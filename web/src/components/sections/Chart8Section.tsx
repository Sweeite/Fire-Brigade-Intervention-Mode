"use client";

import type { FirefighterGear, HindranceLevel, StairHoseLoad } from "fbim-engine";
import type { Chart8FormState } from "@/lib/formState";
import { ConditionalBlock, FieldRow, NumberField, Section, SelectField, ToggleField } from "@/components/ui/fields";

const GEAR_OPTIONS: { value: FirefighterGear; label: string }[] = [
  { value: "turnoutUniform", label: "Turnout uniform" },
  { value: "turnoutUniformWithEquipment", label: "Turnout uniform with equipment" },
  { value: "turnoutUniformInBA", label: "Turnout uniform in BA" },
  { value: "hazIncidentSuitInBA", label: "Hazardous incident suit in BA" },
];

const HINDRANCE_OPTIONS: { value: HindranceLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const HOSE_LOAD_OPTIONS: { value: StairHoseLoad; label: string }[] = [
  { value: "none", label: "None (BA with equipment)" },
  { value: "highPressureHose", label: "High-pressure hose" },
  { value: "hose65mm", label: "65mm hose" },
  { value: "hose38mm", label: "38mm hose" },
];

export function Chart8Section({
  value,
  onChange,
}: {
  value: Chart8FormState;
  onChange: (v: Chart8FormState) => void;
}) {
  const set = <K extends keyof Chart8FormState>(key: K, v: Chart8FormState[K]) => onChange({ ...value, [key]: v });

  return (
    <Section
      title="Chart 8 — Travel to set-up area"
      description="Time to reach the set-up area (inside or outside the building), on top of what's already counted reaching the primary information target (Chart 5)."
    >
      <ToggleField
        label="Road travel within site required?"
        value={value.roadTravelEnabled}
        onChange={(v) => set("roadTravelEnabled", v)}
      />
      <ConditionalBlock show={value.roadTravelEnabled}>
        <FieldRow>
          <NumberField
            label="Road travel distance (km)"
            hint="At the adopted site travel speed."
            value={value.roadTravelDistanceKm}
            onChange={(v) => set("roadTravelDistanceKm", v)}
            step={0.01}
          />
          <NumberField
            label="Security procedure delay (s)"
            hint="Table G leaves this open — designer to supply, typically only for high-security buildings. 0 if none."
            value={value.securityProcedureSeconds}
            onChange={(v) => set("securityProcedureSeconds", v)}
          />
        </FieldRow>
      </ConditionalBlock>

      <ToggleField
        label="Safety equipment already donned?"
        hint="If off, Chart 6's donning time is added automatically here — there's no separate field for it in this chart."
        value={value.safetyEquipmentAlreadyDonned}
        onChange={(v) => set("safetyEquipmentAlreadyDonned", v)}
      />

      <SelectField
        label="Set-up area location"
        value={value.setUpAreaLocation}
        onChange={(v) => set("setUpAreaLocation", v)}
        options={[
          { value: "outsideBuilding", label: "Outside building" },
          { value: "insideBuilding", label: "Inside building" },
        ]}
      />

      <ConditionalBlock show={value.setUpAreaLocation === "insideBuilding"}>
        <FieldRow>
          <NumberField
            label="Travel distance (m)"
            value={value.travelDistanceM}
            onChange={(v) => set("travelDistanceM", v)}
          />
          <SelectField
            label="Firefighter gear for this travel"
            value={value.travelGear}
            onChange={(v) => set("travelGear", v)}
            options={GEAR_OPTIONS}
          />
        </FieldRow>

        <ToggleField
          label="Vertical (stair) travel required?"
          value={value.travelVerticalEnabled}
          onChange={(v) => set("travelVerticalEnabled", v)}
        />
        <ConditionalBlock show={value.travelVerticalEnabled}>
          <FieldRow>
            <NumberField
              label="Storeys up"
              value={value.storeysUp}
              onChange={(v) => set("storeysUp", v)}
            />
            <NumberField
              label="Storeys down"
              value={value.storeysDown}
              onChange={(v) => set("storeysDown", v)}
            />
          </FieldRow>
          <SelectField
            label="Hose load carried on stairs"
            value={value.hoseLoad}
            onChange={(v) => set("hoseLoad", v)}
            options={HOSE_LOAD_OPTIONS}
          />
        </ConditionalBlock>

        <ToggleField
          label="Building evacuated?"
          value={value.buildingEvacuated}
          onChange={(v) => set("buildingEvacuated", v)}
        />
        <ConditionalBlock show={!value.buildingEvacuated}>
          <SelectField
            label="Hindrance level"
            hint="Table S — hindrance factor caused by occupants still evacuating. Only applies while the building is not yet evacuated."
            value={value.hindranceLevel}
            onChange={(v) => set("hindranceLevel", v)}
            options={HINDRANCE_OPTIONS}
          />
        </ConditionalBlock>
      </ConditionalBlock>
    </Section>
  );
}
