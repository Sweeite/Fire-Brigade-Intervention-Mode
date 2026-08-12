# fbim-engine

A TypeScript calculation engine for the AFAC **Fire Brigade Intervention
Model (FBIM)** — the fire-engineering methodology used to estimate how long
fire brigade notification, response, access, set-up, and search & rescue
activities take on the way to a design decision about a building's fire
safety systems.

This is the **calculation engine only** (an MVP, by design) — a typed,
tested library that reproduces the FBIM's chart-by-chart logic in code. It
has no UI, no persistence, and no project/file management; it is meant to be
the correctness-critical core that a future web app (or any other frontend)
is built on top of.

## Sources

This engine was built directly from three source documents, cross-checked
against each other:

1. **AFAC Fire Brigade Intervention Model Manual**, Guideline Version 3.0,
   14 April 2020 — defines the 16-chart flow-chart model and its
   calculation methodology (Section 3.3's mean/variance/percentile method,
   Section 5's chart-by-chart decision logic).
2. **AFAC FBIM Dataset**, Reference Document Version 2020.05, May 2020 — the
   companion document giving the actual lettered Tables A–Z (times, speeds,
   means/standard deviations) that the Manual's charts reference.
3. **DDFE FBIM Appendix A Calculator V1.7** (`.xlsm`) — an internal team's
   prior attempt at an Excel implementation of the same model. Used here as
   a *working reference implementation* for exact formula logic (which this
   engine ports faithfully), while fixing its known defects (see below).

## Scope: what's implemented

**Charts 1–12** of the Manual's 16-chart model, covering the incident
timeline from fire start through completion of search & rescue:

| Chart | What it computes |
|---|---|
| 1 | Time for initial brigade notification |
| 2 | Time to dispatch resources |
| 3 | Time for firefighters to respond to dispatch call |
| 4 | Time to reach kerb side |
| 5 | Time for initial determination of fire location |
| 6 | Time to don safety equipment and gather necessary tools |
| 7 | Time to assess fire |
| 8 | Time to travel to set-up area |
| 9 | *(implemented as the shared `travelTime()` helper in `lib/travel.ts`, invoked by charts 5, 7, 8, 10, 11, 12 — not a standalone top-level chart, matching how it's described in the Manual as a reusable sub-chart)* |
| 10 | Time to set up water (initial firefighter protection) |
| 11 | Time to set up water supply requirements |
| 12 | Time for search and rescue |

**Charts 13–16** (exposure protection, salvage/property protection, fire
control & extinguishment, environment protection) are **not implemented**.
They are also the charts most dependent on an externally-supplied design
fire curve (heat release rate over time) that this engine does not model —
a natural next milestone once Charts 1–12 have been validated.

## Known simplifications (read this before trusting a result)

This is an MVP. It is **not** a substitute for a qualified fire engineer's
judgement, and every simplification below is a place where a real
assessment needs more care than this engine currently gives it.

1. **Charts 5–12 are summed sequentially, not scheduled as a critical
   path.** The Manual is explicit that only Charts 1–4 are strictly
   sequential; Charts 5–12 are described as *concurrent* — "the elapsed
   time within this group being the maximum time within any single module
   plus any delays caused by other modules," resolved in practice by
   building a Gantt/critical-path chart of all the computed activity
   durations (Manual, Section 5.3). This engine (like the DDFE spreadsheet
   it was ported from) instead adds every chart's duration back-to-back.
   That produces a **conservative (longer) total**, not a wrong one — but
   it is not the Manual's prescribed method. A true critical-path resolver
   is a natural extension: `engine.ts`'s per-chart `ChartResult`s already
   give exactly the per-activity durations such a scheduler would need.

2. **Chart 3 is included in the final total; the DDFE source it was ported
   from omits it.** The DDFE spreadsheet's own running-total table skips
   straight from "Dispatch" to "Reach Kerb Side," never summing in Chart
   3's "time to respond and depart fire station" — even though the Manual
   explicitly lists Charts 1–4 (notification, dispatch, *response*,
   arrival) as the one strictly-sequential segment of the whole model.
   `engine.ts` fixes this.

3. **No fire-dynamics model.** Per the Manual, FBIM itself never computes
   fire growth, smoke spread, or tenability — those come from an external
   fire-engineering sub-model (zone/field model, etc.) that a design brief
   supplies separately. Chart 12's firefighter tenability gates
   (`safetyLimitsExceededBeforeSearch` / `...DuringSearch`) and Chart 7's
   flashover-adjacent decisions are exposed as plain boolean inputs for a
   caller who *has* such a model to plug into — this engine does not
   evaluate them itself. `FIREFIGHTER_TENABILITY_CRITERIA` in `chart12.ts`
   documents the Manual's quoted numeric criteria for reference.

4. **No recursive multi-appliance dispatch.** The Manual allows charts to
   recursively re-invoke Charts 2–4 (and 11, 13) to dispatch reinforcing
   appliances mid-incident (e.g. Chart 7's "additional resources required,"
   Chart 11's "additional resources and equipment needed"). This engine
   charges the *notification* time for that decision (e.g. Chart 7's flat
   30s dispatch-notify constant) but does not simulate the reinforcing
   unit's own response chain. A caller modelling multiple appliances should
   run the relevant chart functions multiple times and combine results
   themselves.

5. **Chart 11's "inadequate on-site water supply" branch is unsupported.**
   The DDFE source this was ported from never implemented that branch
   either — its own developer notes call it a "unique circumstance" outside
   the worked model. `chart11()` returns an explicit
   `{ status: "unsupported" }` result rather than fabricating a number.

6. **Several dataset table entries are open, project-specific parameters,
   not fixed constants** — e.g. Table B's notification/dial-connection
   delays, Table G's security-procedure delay, Table S's evacuation-hindrance
   factor. The AFAC Dataset itself leaves these as "designer to supply" /
   "consult with fire service" / "refer to evacuation model." This engine
   surfaces them as required or optional numeric inputs rather than
   inventing default values — except where the DDFE calculator supplied a
   convenience default (Table S's low/medium/high tiers,
   `TABLE_S_DDFE_DEFAULT`), which is carried over and clearly labelled as
   DDFE-sourced, not AFAC-sourced.

7. **Travel speeds use each table's 10th-percentile ("p10") value, not the
   mean.** This matches the DDFE calculator's actual working formulas — a
   deliberately conservative/"reasonable worst case" choice (a slower
   speed produces a longer, safer time estimate), consistent with the
   Manual's general design philosophy, but it is a modelling choice worth
   knowing about rather than assuming it's the statistical mean.

## Usage

```ts
import { runFbimEngine } from "fbim-engine";

const result = runFbimEngine({
  chart1: { /* ... */ },
  chart2: { /* ... */ },
  chart3: { /* ... */ },
  chart4: { samples: [ /* Google-Maps-sourced travel time samples */ ] },
  chart6: { /* PPE/tools needed */ },
  chart5: (donSafetyEquipmentSeconds) => ({ /* uses Chart 6's result */ }),
  chart7: { /* ... */ },
  chart8: (donSafetyEquipmentSeconds) => ({ /* uses Chart 6's result */ }),
  chart11: { /* optional — omit if no additional water supply is needed */ },
  chart10: (waterSupplyRequirementsSeconds) => ({ /* uses Chart 11's result, if provided */ }),
  chart12: { /* ... */ },
});

console.log(result.totalMinutes, result.timeline, result.warnings);
```

Charts 5, 8 and 10 take a **builder function** instead of a plain object,
because their inputs depend on another chart's computed result (Chart 6's
donning time; Chart 11's water-supply time) that can only be known after
that chart has run. `runFbimEngine` computes the dependency first and calls
your builder with the result.

Every chart module (`src/charts/chart*.ts`) can also be used standalone —
each exports a pure `chartN(input): ChartResult` function (or a
discriminated-union result type for Charts 11 and 12, which can return
`"unsupported"`/`"blocked"` instead of a duration) with no dependency on the
others beyond the shared helpers in `src/lib/`.

## Development

```sh
npm install
npm test        # vitest
npm run build    # tsc -> dist/
```

`test/percentile.test.ts` and `test/chart4.test.ts` validate against the
Manual's own worked examples (Section 3.3's hose-rolling percentile
example; Chart 4's kerb-side travel-time methodology). The rest of the
suite covers each chart's branch logic and an end-to-end engine run.
