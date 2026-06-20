import assert from "node:assert/strict";
import { buildReviewSnapshot, reviewSnapshotFileName } from "./review-snapshot.ts";
import type { QuantityRow } from "./types.ts";

const rows: QuantityRow[] = [
  {
    floor: "一层",
    spaceName: "厨房",
    spaceType: "厨房",
    floorAreaM2: 4.48,
    ceilingAreaM2: 4.48,
    wallMeasureLengthM: 9.12,
    heightM: 2.8,
    windowWidthTotalM: 0,
    windowAreaM2: 0,
    doorWidthTotalM: 1,
    doorDeductAreaM2: 0,
    wallGrossAreaM2: 25.54,
    latexPaintAreaM2: 25.54,
    evidence: "formula",
    anomalies: [],
    status: "confirmed",
  },
];

const snapshot = buildReviewSnapshot({
  fileName: "test-case.dxf",
  calibrationFileName: "test-case.calibration.json",
  rows,
  summary: {
    space_count: 1,
    floor_area_total_m2: 4.48,
    wall_measure_length_total_m: 9.12,
    window_area_total_m2: 0,
    latex_paint_area_total_m2: 25.54,
  },
  comparison: null,
});

assert.equal(snapshot.source_file, "test-case.dxf");
assert.equal(snapshot.calibration_file, "test-case.calibration.json");
assert.equal(snapshot.rows[0].status, "confirmed");
assert.equal(snapshot.summary.space_count, 1);
assert.equal(reviewSnapshotFileName("test-case.dxf"), "test-case.review-snapshot.json");
assert.equal(reviewSnapshotFileName("样例数据"), "review-snapshot.json");
