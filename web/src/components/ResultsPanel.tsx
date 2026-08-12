"use client";

import type { FbimEngineResult } from "fbim-engine";

function formatMinutesSeconds(totalSeconds: number): string {
  const mm = Math.floor(totalSeconds / 60);
  const ss = Math.round(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mm}:${ss}`;
}

export function ResultsPanel({ result }: { result: FbimEngineResult | null }) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Fill in the charts and press <span className="font-medium">Run FBIM</span> to see the timeline.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Timeline</h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">{formatMinutesSeconds(result.totalSeconds)}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {result.totalSeconds.toFixed(0)}s ({result.totalMinutes.toFixed(2)} min)
            </div>
          </div>
        </div>

        <ol className="mt-5 flex flex-col gap-0">
          {result.timeline.map((entry, i) => (
            <li
              key={i}
              className="flex items-center justify-between border-t border-zinc-100 py-2.5 text-sm first:border-t-0 dark:border-zinc-800"
            >
              <span className="text-zinc-700 dark:text-zinc-300">{entry.label}</span>
              <span className="flex items-baseline gap-3 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                <span>+{entry.activitySeconds.toFixed(1)}s</span>
                <span className="w-14 text-right font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatMinutesSeconds(entry.cumulativeSeconds)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {result.searchAndRescueBlocked && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <strong className="block">Search and rescue blocked</strong>
          {result.searchAndRescueBlocked.reason}
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <strong className="mb-1 block">Warnings</strong>
          <ul className="list-inside list-disc">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
