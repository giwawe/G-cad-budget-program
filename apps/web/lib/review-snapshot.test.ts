import assert from "node:assert/strict";
import { EMPTY_HYDROPOWER_SUMMARY } from "./hydropower-estimate.ts";
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
    floorTilePieceCount: 5,
    electricalScopeAreaM2: 4.48,
    plumbingScopeAreaM2: 4.48,
    newWallLengthM: 0,
    newWallAreaM2: 0,
    demolitionWallLengthM: 0,
    demolitionWallAreaM2: 0,
    backgroundWallAreaM2: 8.32,
    interiorDoorCount: 0,
    bathroomDoorCount: 1,
    slidingDoorAreaM2: 3.36,
    slidingDoorCasingLengthM: 5.8,
    kitchenBaseCabinetLengthM: 4.3,
    kitchenWallCabinetLengthM: 3,
    toiletCount: 1,
    bathroomVanityCount: 1,
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
  acceptedHealthCheckKeys: ["space-type-other:客厅"],
  excelManualItemQuantities: {
    入户门: 1,
    马桶: 2,
    淋浴隔断: 2,
  },
  summary: {
    space_count: 1,
    building_area_m2: 20,
    floor_area_total_m2: 4.48,
    wall_measure_length_total_m: 9.12,
    window_area_total_m2: 0,
    latex_paint_area_total_m2: 25.54,
  },
  comparison: null,
  hydropower: {
    reviewStatus: "confirmed",
    points: [
      {
        id: "一层-客厅-sofa_charging_outlet-1",
        floor: "一层",
        spaceName: "一层-客厅",
        spaceType: "客厅",
        kind: "sofa_charging_outlet",
        label: "沙发充电插座",
        quantity: 1,
        point: { x: 1.2, y: 3.4 },
        source: "virtual_point",
        confidence: "medium",
        note: "系统按空间轮廓生成推荐点位",
      },
    ],
    pipes: [],
    summary: { ...EMPTY_HYDROPOWER_SUMMARY, sofaChargingOutletCount: 1 },
  },
});

assert.equal(snapshot.source_file, "test-case.dxf");
assert.equal(snapshot.calibration_file, "test-case.calibration.json");
assert.equal(snapshot.rows[0].status, "confirmed");
assert.equal(snapshot.hydropower?.reviewStatus, "confirmed");
assert.deepEqual(snapshot.accepted_health_check_keys, ["space-type-other:客厅"]);
assert.deepEqual(snapshot.excel_manual_item_quantities, { 入户门: 1, 马桶: 2, 淋浴隔断: 2 });
assert.equal(snapshot.summary.space_count, 1);
assert.equal(snapshot.summary.building_area_m2, 20);
assert.equal(reviewSnapshotFileName("test-case.dxf"), "test-case.review-snapshot.json");
assert.equal(reviewSnapshotFileName("样例数据"), "review-snapshot.json");

const parsed = parseReviewSnapshot(JSON.stringify(snapshot));

assert.equal(parsed.source_file, "test-case.dxf");
assert.equal(parsed.rows[0].spaceName, "厨房");
assert.equal(parsed.hydropower?.reviewStatus, "confirmed");
assert.deepEqual(parsed.accepted_health_check_keys, ["space-type-other:客厅"]);
assert.deepEqual(parsed.excel_manual_item_quantities, { 入户门: 1, 马桶: 2, 淋浴隔断: 2 });

const legacySnapshot = {
  ...snapshot,
  summary: {
    ...snapshot.summary,
    building_area_m2: undefined,
  },
  rows: rows.map(
    ({
      curtainWallWidthM: _curtainWallWidthM,
      curtainWallWidthSource: _curtainWallWidthSource,
      wallTileMeasureLengthM: _wallTileMeasureLengthM,
      floorTilePieceCount: _floorTilePieceCount,
      electricalScopeAreaM2: _electricalScopeAreaM2,
      plumbingScopeAreaM2: _plumbingScopeAreaM2,
      customCabinetAreaM2: _customCabinetAreaM2,
      newWallLengthM: _newWallLengthM,
      newWallAreaM2: _newWallAreaM2,
      demolitionWallLengthM: _demolitionWallLengthM,
      demolitionWallAreaM2: _demolitionWallAreaM2,
      backgroundWallAreaM2: _backgroundWallAreaM2,
      interiorDoorCount: _interiorDoorCount,
      bathroomDoorCount: _bathroomDoorCount,
      slidingDoorAreaM2: _slidingDoorAreaM2,
      slidingDoorCasingLengthM: _slidingDoorCasingLengthM,
      kitchenBaseCabinetLengthM: _kitchenBaseCabinetLengthM,
      kitchenWallCabinetLengthM: _kitchenWallCabinetLengthM,
      toiletCount: _toiletCount,
      bathroomVanityCount: _bathroomVanityCount,
      ...row
    }) => row,
  ),
};

const parsedLegacySnapshot = parseReviewSnapshot(JSON.stringify(legacySnapshot));

assert.equal(parsedLegacySnapshot.rows[0].curtainWallWidthM, 0);
assert.equal(parsedLegacySnapshot.rows[0].curtainWallWidthSource, "not_applicable");
assert.equal(parsedLegacySnapshot.rows[0].wallTileMeasureLengthM, 0);
assert.equal(parsedLegacySnapshot.rows[0].floorTilePieceCount, 0);
assert.equal(parsedLegacySnapshot.rows[0].electricalScopeAreaM2, 0);
assert.equal(parsedLegacySnapshot.rows[0].plumbingScopeAreaM2, 0);
assert.equal(parsedLegacySnapshot.rows[0].customCabinetAreaM2, 0);
assert.equal(parsedLegacySnapshot.rows[0].newWallLengthM, 0);
assert.equal(parsedLegacySnapshot.rows[0].newWallAreaM2, 0);
assert.equal(parsedLegacySnapshot.rows[0].demolitionWallLengthM, 0);
assert.equal(parsedLegacySnapshot.rows[0].demolitionWallAreaM2, 0);
assert.equal(parsedLegacySnapshot.rows[0].backgroundWallAreaM2, 0);
assert.equal(parsedLegacySnapshot.rows[0].interiorDoorCount, 0);
assert.equal(parsedLegacySnapshot.rows[0].bathroomDoorCount, 0);
assert.equal(parsedLegacySnapshot.rows[0].slidingDoorAreaM2, 0);
assert.equal(parsedLegacySnapshot.rows[0].slidingDoorCasingLengthM, 0);
assert.equal(parsedLegacySnapshot.rows[0].kitchenBaseCabinetLengthM, 0);
assert.equal(parsedLegacySnapshot.rows[0].kitchenWallCabinetLengthM, 0);
assert.equal(parsedLegacySnapshot.rows[0].toiletCount, 0);
assert.equal(parsedLegacySnapshot.rows[0].bathroomVanityCount, 0);
assert.equal(parsedLegacySnapshot.summary?.building_area_m2, 0);
assert.deepEqual(parsedLegacySnapshot.accepted_health_check_keys, ["space-type-other:客厅"]);
assert.deepEqual(parsedLegacySnapshot.excel_manual_item_quantities, { 入户门: 1, 马桶: 2, 淋浴隔断: 2 });
assert.equal(parsedLegacySnapshot.hydropower?.reviewStatus, "confirmed");

const olderSnapshot = {
  ...snapshot,
  accepted_health_check_keys: undefined,
  excel_manual_item_quantities: undefined,
};
assert.deepEqual(parseReviewSnapshot(JSON.stringify(olderSnapshot)).accepted_health_check_keys, []);
assert.deepEqual(parseReviewSnapshot(JSON.stringify(olderSnapshot)).excel_manual_item_quantities, {});

const snapshotWithInvalidManualQuantities = {
  ...snapshot,
  excel_manual_item_quantities: {
    入户门: 1,
    韫插潙: -1,
    马桶: Number.NaN,
    窗台石: "bad",
  },
};
assert.deepEqual(parseReviewSnapshot(JSON.stringify(snapshotWithInvalidManualQuantities)).excel_manual_item_quantities, { 入户门: 1 });

const invalidHydropowerSnapshot = {
  ...snapshot,
  hydropower: {
    ...snapshot.hydropower,
    reviewStatus: "invalid",
  },
};
assert.equal(parseReviewSnapshot(JSON.stringify(invalidHydropowerSnapshot)).hydropower, undefined);

assert.throws(() => parseReviewSnapshot("{bad json"), /快照 JSON 格式无效/);
assert.throws(() => parseReviewSnapshot(JSON.stringify({ rows: [] })), /快照缺少 source_file/);
assert.throws(() => parseReviewSnapshot(JSON.stringify({ source_file: "x.dxf", rows: "bad" })), /快照缺少 rows/);
