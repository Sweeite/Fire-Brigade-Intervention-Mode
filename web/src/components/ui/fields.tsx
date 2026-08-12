"use client";

import type { ReactNode } from "react";

/** A titled card wrapping one chart's form fields. */
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </div>
  );
}

/** Groups a label + control + optional hint, consistent spacing. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
      {hint && <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

export function NumberField({
  label,
  hint,
  value,
  onChange,
  min = 0,
  step,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        className={inputClass}
        value={Number.isFinite(value) ? value : 0}
        min={min}
        step={step ?? "any"}
        onChange={(e) => onChange(e.target.valueAsNumber || 0)}
      />
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <Field label={label} hint={hint}>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function ToggleField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
        {hint && <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          value ? "bg-red-600" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function CheckboxGroup<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: T[];
  onChange: (v: T[]) => void;
  options: { value: T; label: string }[];
}) {
  const toggle = (opt: T) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-col gap-2 pt-1">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500 dark:border-zinc-700"
              checked={value.includes(o.value)}
              onChange={() => toggle(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </Field>
  );
}

/** A two-column responsive grid for placing related fields side by side. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

/** Visually de-emphasised block of fields that only matter when a toggle
 * above them is on — keeps the "this only applies if..." branches legible. */
export function ConditionalBlock({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <div className="flex flex-col gap-4 rounded-md border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
      {children}
    </div>
  );
}
