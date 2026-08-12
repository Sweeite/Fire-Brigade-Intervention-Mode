"use client";

import type { TravelSample } from "fbim-engine";
import type { Chart4FormState } from "@/lib/formState";
import { Section } from "@/components/ui/fields";

const DAYS: TravelSample["dayOfWeek"][] = ["Tuesday", "Friday", "Saturday"];
const TIMES: TravelSample["timeOfDay"][] = ["08:30", "12:00", "17:00", "23:00"];

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

export function Chart4Section({
  value,
  onChange,
}: {
  value: Chart4FormState;
  onChange: (v: Chart4FormState) => void;
}) {
  const updateRow = (i: number, row: TravelSample) => {
    const samples = [...value.samples];
    samples[i] = row;
    onChange({ samples });
  };
  const removeRow = (i: number) => onChange({ samples: value.samples.filter((_, idx) => idx !== i) });
  const addRow = () =>
    onChange({
      samples: [...value.samples, { dayOfWeek: "Tuesday", timeOfDay: "08:30", rangeMinMinutes: 5, rangeMaxMinutes: 10 }],
    });

  const slowest = value.samples.reduce(
    (max, s) => (s.rangeMaxMinutes > (max?.rangeMaxMinutes ?? -Infinity) ? s : max),
    null as TravelSample | null,
  );

  return (
    <Section
      title="Chart 4 — Reach kerb side"
      description="Travel time from appliance mobilisation to the street address, sourced from Google-Maps-style samples to the second-closest station across 3 days x 4 times of day. The design value is the median of the sample with the slowest (highest) upper bound."
    >
      <div className="flex flex-col gap-2">
        {value.samples.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2">
            <select
              className={inputClass}
              value={row.dayOfWeek}
              onChange={(e) => updateRow(i, { ...row, dayOfWeek: e.target.value as TravelSample["dayOfWeek"] })}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={row.timeOfDay}
              onChange={(e) => updateRow(i, { ...row, timeOfDay: e.target.value as TravelSample["timeOfDay"] })}
            >
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="number"
              className={inputClass}
              placeholder="min (min)"
              value={row.rangeMinMinutes}
              min={0}
              onChange={(e) => updateRow(i, { ...row, rangeMinMinutes: e.target.valueAsNumber || 0 })}
            />
            <input
              type="number"
              className={inputClass}
              placeholder="max (min)"
              value={row.rangeMaxMinutes}
              min={0}
              onChange={(e) => updateRow(i, { ...row, rangeMaxMinutes: e.target.valueAsNumber || 0 })}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
              aria-label="Remove sample"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="self-start rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-red-400 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400"
      >
        + Add sample
      </button>

      {slowest && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Slowest sample: {slowest.dayOfWeek} {slowest.timeOfDay} ({slowest.rangeMinMinutes}&ndash;
          {slowest.rangeMaxMinutes} min) &mdash; design value ={" "}
          {((slowest.rangeMinMinutes + slowest.rangeMaxMinutes) / 2).toFixed(1)} min.
        </span>
      )}
      {value.samples.length === 0 && (
        <span className="text-xs text-red-600">At least one sample is required — the engine will throw otherwise.</span>
      )}
    </Section>
  );
}
