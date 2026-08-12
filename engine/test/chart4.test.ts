import { describe, expect, it } from "vitest";
import { chart4, type TravelSample } from "../src/charts/chart4.js";

describe("chart4 — reach kerb side", () => {
  // Table 5.3's worked example (340 Albert Street, East Melbourne -> Fire
  // Station 10, 2.3km) gives only two of its twelve sampled values in the
  // extracted Manual text (Tuesday 08:30 "5-14 min", Saturday 23:00
  // "5-8 min") and states the adopted design value is 10 minutes — not
  // enough of the full sample matrix to reconstruct exactly, so this test
  // validates the *methodology* (median of the slowest-upper-bound sample)
  // with a synthetic sample set instead of reproducing that specific
  // worked number end-to-end.
  it("adopts the median of the sample with the highest upper bound", () => {
    const samples: TravelSample[] = [
      { dayOfWeek: "Tuesday", timeOfDay: "08:30", rangeMinMinutes: 5, rangeMaxMinutes: 14 },
      { dayOfWeek: "Tuesday", timeOfDay: "12:00", rangeMinMinutes: 4, rangeMaxMinutes: 9 },
      { dayOfWeek: "Friday", timeOfDay: "17:00", rangeMinMinutes: 6, rangeMaxMinutes: 12 },
      { dayOfWeek: "Saturday", timeOfDay: "23:00", rangeMinMinutes: 5, rangeMaxMinutes: 8 },
    ];

    const result = chart4({ samples });

    // Slowest sample is Tuesday 08:30 (upper bound 14). Design value =
    // median(5, 14) = 9.5 minutes = 570 seconds.
    expect(result.seconds).toBeCloseTo(9.5 * 60, 5);
    expect(result.breakdown[0]?.label).toContain("Tuesday 08:30");
  });

  it("throws with no samples rather than silently returning zero", () => {
    expect(() => chart4({ samples: [] })).toThrow();
  });

  it("a single sample resolves to the median of its own range", () => {
    const result = chart4({
      samples: [{ dayOfWeek: "Friday", timeOfDay: "12:00", rangeMinMinutes: 6, rangeMaxMinutes: 10 }],
    });
    expect(result.seconds).toBeCloseTo(8 * 60, 5);
  });
});
