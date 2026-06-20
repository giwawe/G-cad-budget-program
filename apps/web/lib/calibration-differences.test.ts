import assert from "node:assert/strict";
import { differenceKey, indexDifferencesByCell } from "./calibration-differences.ts";
import type { CalibrationDifference } from "./types.ts";

const differences: CalibrationDifference[] = [
  {
    space_name: "厨房",
    field: "floor_area_m2",
    actual: 4.48,
    expected: 4.5,
    delta: -0.02,
    percent_delta: -0.44,
  },
  {
    space_name: "客厅",
    field: "latex_paint_area_m2",
    actual: 56.95,
    expected: 56.1,
    delta: 0.85,
    percent_delta: 1.52,
  },
];

const indexed = indexDifferencesByCell(differences);

assert.equal(differenceKey("厨房", "floor_area_m2"), "厨房::floor_area_m2");
assert.equal(indexed.get("厨房::floor_area_m2")?.expected, 4.5);
assert.equal(indexed.get("客厅::latex_paint_area_m2")?.delta, 0.85);
assert.equal(indexed.get("卧室::floor_area_m2"), undefined);
