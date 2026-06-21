import assert from "node:assert/strict";
import { updateQuantityRowStatus } from "./quantity-row-status.ts";
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
    windowAreaM2: 0,
    doorWidthTotalM: 1,
    doorDeductAreaM2: 0,
    wallGrossAreaM2: 25.54,
    latexPaintAreaM2: 25.54,
    wallTileAreaM2: 20.7,
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
    windowAreaM2: 0,
    doorWidthTotalM: 3.52,
    doorDeductAreaM2: 0,
    wallGrossAreaM2: 56.95,
    latexPaintAreaM2: 56.95,
    wallTileAreaM2: 0,
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
