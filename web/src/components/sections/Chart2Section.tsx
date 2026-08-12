"use client";

import type { Chart2FormState } from "@/lib/formState";
import { ConditionalBlock, NumberField, Section, SelectField, ToggleField } from "@/components/ui/fields";

export function Chart2Section({
  value,
  onChange,
}: {
  value: Chart2FormState;
  onChange: (v: Chart2FormState) => void;
}) {
  const set = <K extends keyof Chart2FormState>(key: K, v: Chart2FormState[K]) => onChange({ ...value, [key]: v });

  return (
    <Section
      title="Chart 2 — Dispatch resources"
      description="Time from information being received/understood by the brigade to the first appliance proceeding toward the scene."
    >
      <ToggleField
        label="Was the call received via telephone, radio or passer-by?"
        hint="If there's no automatic detection connection, select yes."
        value={value.callReceivedVerbally}
        onChange={(v) => set("callReceivedVerbally", v)}
      />
      <ConditionalBlock show={value.callReceivedVerbally}>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Adds Table C&apos;s 60s &quot;time to receive and take down verbal information&quot;.
        </span>
      </ConditionalBlock>

      <SelectField
        label="How is dispatch information relayed?"
        value={value.dispatchRelayMethod}
        onChange={(v) => set("dispatchRelayMethod", v)}
        options={[
          { value: "fullyElectronicCAD", label: "Fully electronic CAD (0s)" },
          { value: "partManualCAD", label: "Part-manual CAD (15s)" },
          { value: "phoneOrRadio", label: "Phone or radio (30s)" },
          { value: "special", label: "Special dispatch method" },
        ]}
      />
      <ConditionalBlock show={value.dispatchRelayMethod === "special"}>
        <NumberField
          label="Special dispatch time (s)"
          hint="Table D leaves this open — to be assessed with the brigade."
          value={value.specialDispatchSeconds}
          onChange={(v) => set("specialDispatchSeconds", v)}
        />
      </ConditionalBlock>
    </Section>
  );
}
