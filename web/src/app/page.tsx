"use client";

import { useState } from "react";
import { runFbimEngine, type FbimEngineResult } from "fbim-engine";
import { defaultFormState, type FbimFormState } from "@/lib/formState";
import { buildEngineInput } from "@/lib/mappers";
import { ResultsPanel } from "@/components/ResultsPanel";
import { Chart1Section } from "@/components/sections/Chart1Section";
import { Chart2Section } from "@/components/sections/Chart2Section";
import { Chart3Section } from "@/components/sections/Chart3Section";
import { Chart4Section } from "@/components/sections/Chart4Section";
import { Chart5Section } from "@/components/sections/Chart5Section";
import { Chart6Section } from "@/components/sections/Chart6Section";
import { Chart7Section } from "@/components/sections/Chart7Section";
import { Chart8Section } from "@/components/sections/Chart8Section";
import { Chart10Section } from "@/components/sections/Chart10Section";
import { Chart11Section } from "@/components/sections/Chart11Section";
import { Chart12Section } from "@/components/sections/Chart12Section";

const NAV = [
  { id: "chart1", label: "1. Notification" },
  { id: "chart2", label: "2. Dispatch" },
  { id: "chart3", label: "3. Firefighter response" },
  { id: "chart4", label: "4. Reach kerb side" },
  { id: "chart5", label: "5. Determine fire location" },
  { id: "chart6", label: "6. Don PPE / gather tools" },
  { id: "chart7", label: "7. Assess fire" },
  { id: "chart8", label: "8. Travel to set-up area" },
  { id: "chart11", label: "11. Water supply requirements" },
  { id: "chart10", label: "10. Set up water" },
  { id: "chart12", label: "12. Search and rescue" },
];

export default function Home() {
  const [state, setState] = useState<FbimFormState>(defaultFormState);
  const [result, setResult] = useState<FbimEngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FbimFormState>(key: K, value: FbimFormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function handleRun() {
    try {
      const engineResult = runFbimEngine(buildEngineInput(state));
      setResult(engineResult);
      setError(null);
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Fire Brigade Intervention Model</h1>
        <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
          Estimates fire brigade notification, response, access, set-up and search &amp; rescue times, per the AFAC
          FBIM Manual (v3.0, 2020) and Dataset (v2020.05). Charts 1&ndash;12 are implemented; this is an MVP &mdash;
          see the{" "}
          <a
            className="underline underline-offset-2 hover:text-red-600"
            href="https://github.com/Sweeite/Fire-Brigade-Intervention-Mode/blob/main/engine/README.md"
            target="_blank"
            rel="noreferrer"
          >
            engine README
          </a>{" "}
          for exactly what&apos;s simplified before relying on a result.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[180px_1fr]">
        <nav className="hidden lg:block">
          <div className="sticky top-8 flex flex-col gap-1 text-sm">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#results"
              className="mt-2 rounded-md px-3 py-1.5 font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Results
            </a>
          </div>
        </nav>

        <main className="flex flex-col gap-6">
          <div id="chart1">
            <Chart1Section value={state.chart1} onChange={(v) => update("chart1", v)} />
          </div>
          <div id="chart2">
            <Chart2Section value={state.chart2} onChange={(v) => update("chart2", v)} />
          </div>
          <div id="chart3">
            <Chart3Section value={state.chart3} onChange={(v) => update("chart3", v)} />
          </div>
          <div id="chart4">
            <Chart4Section value={state.chart4} onChange={(v) => update("chart4", v)} />
          </div>
          <div id="chart5">
            <Chart5Section value={state.chart5} onChange={(v) => update("chart5", v)} />
          </div>
          <div id="chart6">
            <Chart6Section value={state.chart6} onChange={(v) => update("chart6", v)} />
          </div>
          <div id="chart7">
            <Chart7Section value={state.chart7} onChange={(v) => update("chart7", v)} />
          </div>
          <div id="chart8">
            <Chart8Section value={state.chart8} onChange={(v) => update("chart8", v)} />
          </div>
          <div id="chart11">
            <Chart11Section value={state.chart11} onChange={(v) => update("chart11", v)} />
          </div>
          <div id="chart10">
            <Chart10Section value={state.chart10} onChange={(v) => update("chart10", v)} />
          </div>
          <div id="chart12">
            <Chart12Section value={state.chart12} onChange={(v) => update("chart12", v)} />
          </div>

          <div className="sticky bottom-4 z-10 flex justify-center">
            <button
              type="button"
              onClick={handleRun}
              className="rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 active:scale-[0.98]"
            >
              Run FBIM
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              <strong className="block">Could not compute a result</strong>
              {error}
            </div>
          )}

          <div id="results">
            <ResultsPanel result={result} />
          </div>
        </main>
      </div>
    </div>
  );
}
