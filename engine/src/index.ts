export * from "./types.js";
export * from "./engine.js";

export * from "./charts/chart1.js";
export * from "./charts/chart2.js";
export * from "./charts/chart3.js";
export * from "./charts/chart4.js";
export * from "./charts/chart5.js";
export * from "./charts/chart6.js";
export * from "./charts/chart7.js";
export * from "./charts/chart8.js";
export * from "./charts/chart10.js";
export * from "./charts/chart11.js";
export * from "./charts/chart12.js";

// Flat re-export of the dataset tables and shared helpers, for convenient
// direct imports (e.g. `import type { SprinklerSystemType } from "fbim-engine"`).
export * from "./data/tables.js";
export * from "./lib/percentile.js";
export * from "./lib/travel.js";

// Also available as namespaces, for callers who prefer `tables.TABLE_A`
// style access or want to avoid any naming collisions with the flat exports.
export * as tables from "./data/tables.js";
export * as percentile from "./lib/percentile.js";
export * as travel from "./lib/travel.js";
