"use client";

import type { SprinklerSystemType } from "fbim-engine";
import type { Chart1FormState } from "@/lib/formState";
import { ConditionalBlock, Field, FieldRow, NumberField, Section, SelectField, ToggleField } from "@/components/ui/fields";

const SPRINKLER_OPTIONS: { value: SprinklerSystemType; label: string }[] = [
  { value: "as2118.1", label: "AS 2118.1 sprinkler system" },
  { value: "combinedOHIUnder1000sqm", label: "Combined OHI, < 1,000 m²" },
  { value: "combinedOHI1000to2000sqm", label: "Combined OHI, 1,000–2,000 m²" },
  { value: "combinedOHIOver2000sqm", label: "Combined OHI, > 2,000 m²" },
];

export function Chart1Section({
  value,
  onChange,
}: {
  value: Chart1FormState;
  onChange: (v: Chart1FormState) => void;
}) {
  const set = <K extends keyof Chart1FormState>(key: K, v: Chart1FormState[K]) => onChange({ ...value, [key]: v });

  return (
    <Section
      title="Chart 1 — Initial brigade notification"
      description="Time from fire detection to the point information has been received and understood by the fire brigade."
    >
      <ToggleField
        label="Automatic detection or suppression system installed?"
        hint="Turning this off switches to manual detection below — the two are mutually exclusive in this form."
        value={value.automaticDetectionOrSuppressionInstalled}
        onChange={(v) =>
          onChange({
            ...value,
            automaticDetectionOrSuppressionInstalled: v,
            // Keep the two detection paths mutually exclusive: switching to
            // automatic clears manual detection; switching to manual
            // ensures a method is actually selected (not left at "none",
            // which the mapper would otherwise silently treat as "no
            // detection method charged at all").
            manualDetectionVia: v ? "none" : value.manualDetectionVia === "none" ? "occupantCues" : value.manualDetectionVia,
          })
        }
      />
      <ConditionalBlock show={value.automaticDetectionOrSuppressionInstalled}>
        <NumberField
          label="Time to activate the system (s)"
          hint="From an external detection-time calculation — not a dataset value."
          value={value.automaticActivationSeconds}
          onChange={(v) => set("automaticActivationSeconds", v)}
        />
        <ToggleField label="Sprinklers used?" value={value.hasSprinklers} onChange={(v) => set("hasSprinklers", v)} />
        <ConditionalBlock show={value.hasSprinklers}>
          <SelectField
            label="Sprinkler system type"
            hint="Table A — time to depressurise system and activate alarm, plus a 20s alarm-verification delay."
            value={value.sprinklerSystemType}
            onChange={(v) => set("sprinklerSystemType", v)}
            options={SPRINKLER_OPTIONS}
          />
        </ConditionalBlock>
      </ConditionalBlock>

      <ConditionalBlock show={!value.automaticDetectionOrSuppressionInstalled}>
        <SelectField
          label="Manual detection method"
          value={value.manualDetectionVia === "none" ? "occupantCues" : value.manualDetectionVia}
          onChange={(v) => set("manualDetectionVia", v)}
          options={[
            { value: "occupantCues", label: "Detection via occupant cues" },
            { value: "otherMeans", label: "Other means (watchman, passer-by, sirens)" },
          ]}
        />
        <NumberField
          label="Time to verify fire (s)"
          hint="Table B leaves this open — project-specific."
          value={value.timeToVerifyFireSeconds}
          onChange={(v) => set("timeToVerifyFireSeconds", v)}
        />
      </ConditionalBlock>

      <FieldRow>
        <SelectField
          label="How is the brigade ultimately notified?"
          value={value.brigadeConnectionMethod}
          onChange={(v) => set("brigadeConnectionMethod", v)}
          options={[
            { value: "direct", label: "Automatic, direct, uninterrupted connection" },
            { value: "intermediateMonitoring", label: "Intermediate monitoring organisation" },
            { value: "telephone", label: "Telephone notification" },
            { value: "specialOption", label: "Special option" },
          ]}
        />
        {value.brigadeConnectionMethod !== "direct" && (
          <NumberField
            label="Delay for this notification method (s)"
            hint="Table B leaves this open — project-specific."
            value={value.brigadeConnectionSeconds}
            onChange={(v) => set("brigadeConnectionSeconds", v)}
          />
        )}
      </FieldRow>
      {value.brigadeConnectionMethod === "direct" && (
        <Field label="">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Direct connection — no additional notification delay.
          </span>
        </Field>
      )}
    </Section>
  );
}
