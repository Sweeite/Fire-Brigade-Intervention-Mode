"use client";

import type { DoorType, FirefighterGear, HindranceLevel, WayFindingComplexity } from "fbim-engine";
import type { Chart5FormState } from "@/lib/formState";
import { ConditionalBlock, FieldRow, NumberField, Section, SelectField, ToggleField } from "@/components/ui/fields";

const DOOR_TYPE_OPTIONS: { value: DoorType; label: string }[] = [
  { value: "inwardSideHungDoor", label: "Inward side-hung door" },
  { value: "outwardSideHungFireDoor", label: "Outward side-hung fire door" },
  { value: "outwardSideHungSolidCoreDoor", label: "Outward side-hung solid-core door" },
  { value: "inwardHollowCoreDoor", label: "Inward hollow-core door" },
  { value: "outwardHollowCoreDoor", label: "Outward hollow-core door" },
  { value: "glassDoor", label: "Glass door" },
  { value: "rollerSecurityDoor", label: "Roller security door" },
  { value: "chainedGate", label: "Chained gate" },
];

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

const WAY_FINDING_OPTIONS: { value: WayFindingComplexity; label: string }[] = [
  { value: "singleStoreyOpenPlan", label: "Single storey, open plan" },
  { value: "singleStoreyNumerousEnclosuresUnder5000sqm", label: "Single storey, numerous enclosures, < 5,000 m²" },
  { value: "singleStoreyNumerousEnclosuresOver5000sqm", label: "Single storey, numerous enclosures, > 5,000 m²" },
  { value: "multiLevelOpenPlan", label: "Multi-level, open plan" },
  { value: "multiLevelNumerousEnclosures", label: "Multi-level, numerous enclosures" },
];

export function Chart5Section({
  value,
  onChange,
}: {
  value: Chart5FormState;
  onChange: (v: Chart5FormState) => void;
}) {
  const set = <K extends keyof Chart5FormState>(key: K, v: Chart5FormState[K]) => onChange({ ...value, [key]: v });

  return (
    <Section
      title="Chart 5 — Initial determination of fire location"
      description="Elapsed time to access the building and reach the primary information target (e.g. fire indicator panel / FDCIE / fire control room), including moving from kerb side."
    >
      <NumberField
        label="Site road travel distance (km)"
        hint="Kerb to building/set-up area, at the adopted 8 km/h site travel speed. Applies whether or not the fire is visible on arrival."
        value={value.siteRoadTravelKm}
        onChange={(v) => set("siteRoadTravelKm", v)}
        step={0.01}
      />

      <ToggleField
        label="Fire visible on arrival?"
        hint="If the fire is already visible, no further location-determination assessment is required — the rest of this chart is skipped."
        value={value.fireVisibleOnArrival}
        onChange={(v) => set("fireVisibleOnArrival", v)}
      />

      <ConditionalBlock show={value.fireVisibleOnArrival}>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Fire visible on arrival — no further assessment required for this chart.
        </span>
      </ConditionalBlock>

      <ConditionalBlock show={!value.fireVisibleOnArrival}>
        <FieldRow>
          <ToggleField
            label="Premises occupied?"
            value={value.premisesOccupied}
            onChange={(v) => set("premisesOccupied", v)}
          />
          <ConditionalBlock show={value.premisesOccupied}>
            <ToggleField
              label="Accredited fire warden present?"
              hint="Warden communication time (Table H) is only charged when the premises are occupied AND a warden is present."
              value={value.fireWardenPresent}
              onChange={(v) => set("fireWardenPresent", v)}
            />
          </ConditionalBlock>
        </FieldRow>

        <ToggleField
          label="Forced entry required?"
          hint="On: doors negotiated by force (Table I). Off: negotiated with keys (Table J)."
          value={value.forcedEntryRequired}
          onChange={(v) => set("forcedEntryRequired", v)}
        />
        <FieldRow>
          <SelectField
            label="Door type"
            value={value.doorType}
            onChange={(v) => set("doorType", v)}
            options={DOOR_TYPE_OPTIONS}
          />
          <NumberField
            label="Door count"
            value={value.doorCount}
            onChange={(v) => set("doorCount", v)}
          />
        </FieldRow>

        <NumberField
          label="Floor area (m²)"
          hint="Used for warden communication time (Table H) and information gathering time (Table L)."
          value={value.floorAreaSqm}
          onChange={(v) => set("floorAreaSqm", v)}
        />

        <ToggleField
          label="Apply hindrance factor?"
          hint="Optional — occupants still evacuating/hindering brigade operations (Table S, open dataset parameter)."
          value={value.hindranceEnabled}
          onChange={(v) => set("hindranceEnabled", v)}
        />
        <ConditionalBlock show={value.hindranceEnabled}>
          <SelectField
            label="Hindrance level"
            value={value.hindranceLevel}
            onChange={(v) => set("hindranceLevel", v)}
            options={HINDRANCE_OPTIONS}
          />
        </ConditionalBlock>

        <NumberField
          label="Security procedure delay (s)"
          hint="Table G leaves this open — designer to supply, typically only for high-security buildings (banks, casinos, prisons). 0 if none."
          value={value.securityProcedureSeconds}
          onChange={(v) => set("securityProcedureSeconds", v)}
        />

        <ToggleField
          label="Pre-fire planning documented for this building?"
          hint="On: crew travels directly to the known primary information target. Off: crew spends way-finding time locating it instead."
          value={value.preFirePlanningDocumented}
          onChange={(v) => set("preFirePlanningDocumented", v)}
        />
        <ConditionalBlock show={value.preFirePlanningDocumented}>
          <FieldRow>
            <NumberField
              label="Travel distance to primary information target (m)"
              value={value.travelToTargetDistanceM}
              onChange={(v) => set("travelToTargetDistanceM", v)}
            />
            <SelectField
              label="Firefighter gear for this travel"
              value={value.travelToTargetGear}
              onChange={(v) => set("travelToTargetGear", v)}
              options={GEAR_OPTIONS}
            />
          </FieldRow>
        </ConditionalBlock>
        <ConditionalBlock show={!value.preFirePlanningDocumented}>
          <SelectField
            label="Way-finding complexity"
            hint="Table K — time to resolve way-finding to the primary information target."
            value={value.wayFindingComplexity}
            onChange={(v) => set("wayFindingComplexity", v)}
            options={WAY_FINDING_OPTIONS}
          />
        </ConditionalBlock>
      </ConditionalBlock>
    </Section>
  );
}
