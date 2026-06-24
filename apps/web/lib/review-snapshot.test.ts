import assert from "node:assert/strict";
import { buildReviewSnapshot, parseReviewSnapshot, reviewSnapshotFileName } from "./review-snapshot.ts";
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
    windowsillLengthM: 0,
    curtainWallWidthM: 0,
    curtainWallWidthSource: "not_applicable",
    windowAreaM2: 0,
    doorWidthTotalM: 1,
    doorDeductAreaM2: 0,
    wallGrossAreaM2: 25.54,
    latexPaintAreaM2: 25.54,
    wallTileMeasureLengthM: 9.12,
    wallTileAreaM2: 20.7,
    waterproofAreaM2: 7.22,
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

const parsed = parseReviewSnapshot(JSON.stringify(snapshot));

assert.equal(parsed.source_file, "test-case.dxf");
assert.equal(parsed.rows[0].spaceName, "厨房");

const legacySnapshot = {
  ...snapshot,
  rows: rows.map(({ curtainWallWidthM: _curtainWallWidthM, curtainWallWidthSource: _curtainWallWidthSource, wallTileMeasureLengthM: _wallTileMeasureLengthM, ...row }) => row),
};
const parsedLegacySnapshot = parseReviewSnapshot(JSON.stringify(legacySnapshot));

assert.equal(parsedLegacySnapshot.rows[0].curtainWallWidthM, 0);
assert.equal(parsedLegacySnapshot.rows[0].curtainWallWidthSource, "not_applicable");
assert.equal(parsedLegacySnapshot.rows[0].wallTileMeasureLengthM, 0);

assert.throws(() => parseReviewSnapshot("{bad json"), /快照 JSON 格式无效/);
assert.throws(() => parseReviewSnapshot(JSON.stringify({ rows: [] })), /快照缺少 source_file/);
assert.throws(() => parseReviewSnapshot(JSON.stringify({ source_file: "x.dxf", rows: "bad" })), /快照缺少 rows/);
