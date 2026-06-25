import assert from "node:assert/strict";
import { confirmQuantityRowsBySpaceNames, updateQuantityRowCurtainWallWidth, updateQuantityRowStatus, updateQuantityRowsStatusBySpaceNames } from "./quantity-row-status.ts";
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
    customCabinetAreaM2: 0,
    newWallLengthM: 0,
    newWallAreaM2: 0,
    demolitionWallLengthM: 0,
    demolitionWallAreaM2: 0,
    interiorDoorCount: 0,
    bathroomDoorCount: 0,
    slidingDoorAreaM2: 0,
    slidingDoorCasingLengthM: 0,
    kitchenBaseCabinetLengthM: 0,
    kitchenWallCabinetLengthM: 0,
    toiletCount: 0,
    bathroomVanityCount: 0,
    waterproofAreaM2: 7.22,
    evidence: "",
    anomalies: [],
    status: "pending_review",
  },
  {
    floor: "一层",
    spaceName: "客厅",
    spaceType: "客厅",
    floorAreaM2: 36.52,
    ceilingAreaM2: 36.52,
    wallMeasureLengthM: 20.34,
    heightM: 2.8,
    windowWidthTotalM: 0,
    windowsillLengthM: 0,
    curtainWallWidthM: 0,
    curtainWallWidthSource: "fallback_longest_wall",
    windowAreaM2: 0,
    doorWidthTotalM: 3.52,
    doorDeductAreaM2: 0,
    wallGrossAreaM2: 56.95,
    latexPaintAreaM2: 56.95,
    wallTileMeasureLengthM: 0,
    wallTileAreaM2: 0,
    floorTilePieceCount: 35,
    electricalScopeAreaM2: 36.52,
    plumbingScopeAreaM2: 36.52,
    customCabinetAreaM2: 7.2,
    newWallLengthM: 0,
    newWallAreaM2: 0,
    demolitionWallLengthM: 0,
    demolitionWallAreaM2: 0,
    interiorDoorCount: 0,
    bathroomDoorCount: 0,
    slidingDoorAreaM2: 0,
    slidingDoorCasingLengthM: 0,
    kitchenBaseCabinetLengthM: 0,
    kitchenWallCabinetLengthM: 0,
    toiletCount: 0,
    bathroomVanityCount: 0,
    waterproofAreaM2: 0,
    evidence: "",
    anomalies: [],
    status: "pending_review",
  },
];

const updated = updateQuantityRowStatus(rows, "厨房", "confirmed");

assert.equal(updated[0].status, "confirmed");
assert.equal(updated[1].status, "pending_review");
assert.equal(rows[0].status, "pending_review");
assert.notEqual(updated, rows);

const batchUpdated = updateQuantityRowsStatusBySpaceNames(rows, ["厨房", "不存在"], "needs_fix");

assert.equal(batchUpdated[0].status, "needs_fix");
assert.equal(batchUpdated[1].status, "pending_review");
assert.equal(rows[0].status, "pending_review");
assert.notEqual(batchUpdated, rows);

const confirmedRows = confirmQuantityRowsBySpaceNames(rows, ["厨房", "客厅"]);

assert.equal(confirmedRows[0].status, "confirmed");
assert.equal(confirmedRows[1].status, "confirmed");
assert.equal(rows[0].status, "pending_review");
assert.notEqual(confirmedRows, rows);

const updatedCurtainWidth = updateQuantityRowCurtainWallWidth(rows, "客厅", 5.236);

assert.equal(updatedCurtainWidth[0].curtainWallWidthM, 0);
assert.equal(updatedCurtainWidth[1].curtainWallWidthM, 5.24);
assert.equal(updatedCurtainWidth[1].curtainWallWidthSource, "manual");
assert.equal(rows[1].curtainWallWidthM, 0);
assert.notEqual(updatedCurtainWidth, rows);

const clampedCurtainWidth = updateQuantityRowCurtainWallWidth(rows, "客厅", -1);

assert.equal(clampedCurtainWidth[1].curtainWallWidthM, 0);
