"use client";

import type { SafetyProcedureItem, ToolItem } from "fbim-engine";
import type { Chart6FormState } from "@/lib/formState";
import { CheckboxGroup, NumberField, Section, ToggleField } from "@/components/ui/fields";

const SAFETY_PROCEDURE_OPTIONS: { value: SafetyProcedureItem; label: string }[] = [
  { value: "flushHydrant", label: "Flush hydrant" },
  { value: "obtainHazmatInfo", label: "Obtain hazmat info from comms centre" },
  { value: "decontaminationSetup", label: "Decontamination unit set-up" },
  { value: "assembleMiscEquipment", label: "Assemble misc. safety equipment" },
];

const TOOL_OPTIONS: { value: ToolItem; label: string }[] = [
  { value: "hydrantEquipment", label: "Hydrant equipment" },
  { value: "forcedEntryTools", label: "Forced entry tools" },
  { value: "highRisePack", label: "High-rise pack or similar" },
];

export function Chart6Section({
  value,
  onChange,
}: {
  value: Chart6FormState;
  onChange: (v: Chart6FormState) => void;
}) {
  const set = <K extends keyof Chart6FormState>(key: K, v: Chart6FormState[K]) => onChange({ ...value, [key]: v });

  return (
    <Section
      title="Chart 6 — Don safety equipment and gather tools"
      description="Time to dismount the appliance, don breathing apparatus (BA) and other PPE, conduct safety procedures, and gather tools. Dismounting the appliance and donning BA (Table M) is always included automatically — it is not a toggle here."
    >
      <ToggleField
        label="Other safety equipment required (e.g. hazardous incident suit)?"
        hint="Adds Table N, on top of the standard BA always donned."
        value={value.hazmatSuitRequired}
        onChange={(v) => set("hazmatSuitRequired", v)}
      />

      <CheckboxGroup
        label="Safety procedures"
        hint="Table O — zero or more may apply."
        value={value.safetyProcedures}
        onChange={(v) => set("safetyProcedures", v)}
        options={SAFETY_PROCEDURE_OPTIONS}
      />

      <CheckboxGroup
        label="Tools required"
        hint="Table P — zero or more may apply."
        value={value.toolsRequired}
        onChange={(v) => set("toolsRequired", v)}
        options={TOOL_OPTIONS}
      />

      <NumberField
        label="Target design percentile"
        hint="Target design percentile for the statistical combination of all the above (Manual Section 3.3 method). Defaults to 90."
        value={value.percentile}
        onChange={(v) => set("percentile", v)}
        min={1}
      />
    </Section>
  );
}
