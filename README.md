# Fire Brigade Intervention Model

An implementation of the AFAC **Fire Brigade Intervention Model (FBIM)** —
a fire-engineering calculation engine plus a web UI on top of it.

This is a monorepo (npm workspaces) with two packages:

- **`engine/`** — `fbim-engine`, a standalone TypeScript library implementing
  Charts 1–12 of the AFAC FBIM Manual (v3.0, 2020). No UI, no dependencies
  beyond TypeScript itself. See [`engine/README.md`](engine/README.md) for
  full scope, sources, and — importantly — every known MVP simplification.
  Read that before trusting a result.
- **`web/`** — a Next.js app providing a form-based UI over the engine:
  fill in each chart's inputs, press "Run FBIM", see the resulting
  timeline.

## Quickstart

```sh
npm install                 # installs both workspaces
npm run build:engine        # compiles the engine to engine/dist (required before the web app can import it)
npm run dev:web             # starts the Next.js dev server
```

Then open http://localhost:3000.

To run the engine's own test suite: `npm run test:engine`.

## Deploying the web app to Vercel

The web app lives in a subdirectory (`web/`) of a workspace monorepo, and
depends on the `engine/` package being built first — so a couple of
one-time settings are needed when connecting this repo to Vercel:

1. **Import the repo** at [vercel.com/new](https://vercel.com/new), selecting
   `Sweeite/Fire-Brigade-Intervention-Mode`.
2. In the project's **Root Directory** setting, choose **`web`**.
3. Framework should auto-detect as **Next.js**. Leave the Build/Install
   Command fields on their defaults — `web/vercel.json` already pins them
   explicitly (`cd .. && npm install` for install, `npm run build` for
   build, which in turn builds `engine/` first via `web/package.json`'s
   own build script) so this works regardless of Vercel's monorepo
   auto-detection.
4. Deploy. No environment variables are required — the engine runs
   entirely client-side with no external calls.

Every push to the branch connected in Vercel will redeploy automatically.
For a one-off deploy from your own machine instead: install the Vercel CLI
(`npm i -g vercel`), run `vercel` from the repo root, and when prompted for
the project's root directory, enter `web`.

## Repository layout

```
engine/     fbim-engine — the calculation engine (library, no UI)
web/        Next.js app — the form UI, imports fbim-engine as a dependency
package.json  workspace root (npm workspaces: ["engine", "web"])
```
