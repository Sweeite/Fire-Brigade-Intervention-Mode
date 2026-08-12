"use client";

import type { Chart3FormState } from "@/lib/formState";
import { ConditionalBlock, Section, ToggleField } from "@/components/ui/fields";

export function Chart3Section({
  value,
  onChange,
}: {
  value: Chart3FormState;
  onChange: (v: Chart3FormState) => void;
}) {
  const set = <K extends keyof Chart3FormState>(key: K, v: Chart3FormState[K]) => onChange({ ...value, [key]: v });

  return (
    <Section
      title="Chart 3 — Firefighter response"
      description="Time from turnout signal activation to the appliance proceeding to the scene."
    >
      <ToggleField
        label="Is the fire station staffed full time?"
        value={value.stationStaffedFullTime}
        onChange={(v) => set("stationStaffedFullTime", v)}
      />
      <ConditionalBlock show={!value.stationStaffedFullTime}>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Unstaffed station: 480s to travel to the station, dress, assemble, assimilate information and leave (Table E).
        </span>
      </ConditionalBlock>
      <ConditionalBlock show={value.stationStaffedFullTime}>
        <ToggleField
          label="Are firefighters already in the station?"
          hint="If not, they must first make up and become mobile (60s) rather than just dress and depart (90s)."
          value={value.firefightersAlreadyInStation}
          onChange={(v) => set("firefightersAlreadyInStation", v)}
        />
      </ConditionalBlock>
    </Section>
  );
}
