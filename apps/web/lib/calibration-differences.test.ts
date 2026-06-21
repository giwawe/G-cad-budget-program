import assert from "node:assert/strict";
import { curtainWallCalibrationTarget, differenceKey, indexDifferencesByCell } from "./calibration-differences.ts";
import type { CalibrationDifference, QuantityRow } from "./types.ts";

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

const curtainDifference: CalibrationDifference = {
  space_name: "主卧",
  field: "curtain_wall_width_m",
  actual: 0,
  expected: 4.2,
  delta: -4.2,
  percent_delta: -100,
};
const row = {
  spaceName: "主卧",
  curtainWallWidthM: 0,
  curtainWallWidthSource: "manual_required_l_shape_window",
} as QuantityRow;

assert.equal(curtainWallCalibrationTarget(row, curtainDifference), 4.2);
assert.equal(curtainWallCalibrationTarget({ ...row, curtainWallWidthSource: "fallback_longest_wall" }, curtainDifference), 4.2);
assert.equal(curtainWallCalibrationTarget({ ...row, curtainWallWidthSource: "matched_window_wall" }, curtainDifference), null);
assert.equal(curtainWallCalibrationTarget(row, { ...curtainDifference, field: "floor_area_m2" }), null);
