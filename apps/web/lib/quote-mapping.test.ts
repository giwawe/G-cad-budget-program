import assert from "node:assert/strict";
import { buildQuoteMapping, quoteMappingFileName } from "./quote-mapping.ts";
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
    evidence: "",
    anomalies: [],
    status: "confirmed",
  },
  {
    floor: "一层",
    spaceName: "电梯井",
    spaceType: "其他",
    floorAreaM2: 3.24,
    ceilingAreaM2: 3.24,
    wallMeasureLengthM: 0,
    heightM: 2.8,
    windowWidthTotalM: 0,
    windowAreaM2: 0,
    doorWidthTotalM: 0,
    doorDeductAreaM2: 0,
    wallGrossAreaM2: 0,
    latexPaintAreaM2: 0,
    evidence: "",
    anomalies: [],
    status: "excluded",
  },
];

const mapping = buildQuoteMapping(rows);

assert.equal(mapping.items.length, 3);
assert.equal(mapping.items[0].space_name, "厨房");
assert.equal(mapping.items[0].space_type, "厨房");
assert.equal(mapping.items[0].item_name, "墙面乳胶漆");
assert.equal(mapping.items[0].quantity, 25.54);
assert.equal(mapping.items[0].unit_price, 28);
assert.equal(mapping.items[0].amount, 715.12);
assert.equal(mapping.items[1].item_name, "地面铺装");
assert.equal(mapping.items[2].item_name, "天棚乳胶漆");
assert.equal(mapping.summary.item_count, 3);
assert.equal(mapping.summary.space_count, 1);
assert.equal(mapping.summary.total_amount, 1060.08);

assert.equal(quoteMappingFileName("test-case.dxf"), "test-case.quote-mapping.json");
assert.equal(quoteMappingFileName("样例数据"), "quote-mapping.json");
