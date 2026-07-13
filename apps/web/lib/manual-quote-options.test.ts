import assert from "node:assert/strict";
import {
  aluminumWindowSuggestedAreaFromRows,
  bathroomChoiceKey,
  bathroomManualChoicesFromQuantities,
  bathroomRowsFromRows,
  manualQuoteInputsFromBathroomChoices,
  manualQuoteInputsFromPrices,
  manualQuoteInputsFromQuantities,
  manualQuotePricesFromInputs,
  manualQuoteQuantitiesFromInputs,
} from "./manual-quote-options.ts";
import type { QuantityRow } from "./types.ts";

const baseRow: QuantityRow = {
  floor: "一层",
  spaceName: "客厅",
  spaceType: "客厅",
  floorAreaM2: 10,
  ceilingAreaM2: 10,
  wallMeasureLengthM: 12,
  heightM: 2.8,
  windowWidthTotalM: 0,
  windowsillLengthM: 0,
  curtainWallWidthM: 0,
  curtainWallWidthSource: "not_applicable",
  windowAreaM2: 0,
  doorWidthTotalM: 0,
  doorDeductAreaM2: 0,
  wallGrossAreaM2: 33.6,
  latexPaintAreaM2: 33.6,
  wallTileMeasureLengthM: 0,
  wallTileAreaM2: 0,
  floorTilePieceCount: 0,
  electricalScopeAreaM2: 10,
  plumbingScopeAreaM2: 10,
  newWallLengthM: 0,
  newWallAreaM2: 0,
  demolitionWallLengthM: 0,
  demolitionWallAreaM2: 0,
  backgroundWallAreaM2: 0,
  interiorDoorCount: 0,
  bathroomDoorCount: 0,
  slidingDoorAreaM2: 0,
  slidingDoorCasingLengthM: 0,
  kitchenBaseCabinetLengthM: 0,
  kitchenWallCabinetLengthM: 0,
  customCabinetAreaM2: 0,
  toiletCount: 0,
  bathroomVanityCount: 0,
  waterproofAreaM2: 0,
  evidence: "",
  anomalies: [],
  status: "pending_review",
};

const bathroomRows = bathroomRowsFromRows([
  { ...baseRow, spaceName: "卫生间", spaceType: "卫生间" },
  { ...baseRow, spaceName: "主卫", spaceType: "卫生间", status: "confirmed" },
  { ...baseRow, spaceName: "设备间", spaceType: "卫生间", status: "excluded" },
]);
assert.deepEqual(bathroomRows.map((row) => row.spaceName), ["卫生间", "主卫"]);
assert.notEqual(bathroomChoiceKey(bathroomRows[0], 0), bathroomChoiceKey({ ...bathroomRows[0] }, 1));

assert.equal(
  aluminumWindowSuggestedAreaFromRows([
    { ...baseRow, spaceName: "客厅", windowAreaM2: 3.335 },
    { ...baseRow, spaceName: "卧室", windowAreaM2: 2.2, status: "confirmed" },
    { ...baseRow, spaceName: "管井", windowAreaM2: 99, status: "excluded" },
  ]),
  5.54,
);

assert.deepEqual(manualQuoteQuantitiesFromInputs({ 入户门: "1", 马桶: "2.345", 蹲坑: "-1", 窗台石: "", 铝合金封门窗: "bad" }), {
  入户门: 1,
  马桶: 2.35,
});

assert.deepEqual(manualQuoteInputsFromQuantities({ 入户门: 1, 马桶: 2 }), { 入户门: "1", 马桶: "2" });

assert.deepEqual(manualQuotePricesFromInputs({ 铝合金封门窗: "650.236", 坏单价: "bad", 负数单价: "-1", 空单价: "" }), {
  铝合金封门窗: 650.24,
});

assert.deepEqual(manualQuoteInputsFromPrices({ 铝合金封门窗: 650 }), { 铝合金封门窗: "650" });

assert.deepEqual(
  manualQuoteInputsFromBathroomChoices(
    { 入户门: "1", 马桶: "5", 蹲坑: "0", 淋浴隔断: "3" },
    {
      [bathroomChoiceKey(bathroomRows[0], 0)]: { fixture: "蹲坑", shower: "淋浴隔断" },
      [bathroomChoiceKey(bathroomRows[1], 1)]: { fixture: "马桶", shower: "玻璃淋浴房" },
    },
    bathroomRows,
  ),
  {
  入户门: "1",
    马桶: "1",
    蹲坑: "1",
    淋浴隔断: "1",
    玻璃淋浴房: "1",
  },
);

assert.deepEqual(
  bathroomManualChoicesFromQuantities({ 马桶: 1, 蹲坑: 1, 淋浴隔断: 1, 玻璃淋浴房: 1 }, bathroomRows),
  {
    [bathroomChoiceKey(bathroomRows[0], 0)]: { fixture: "马桶", shower: "淋浴隔断" },
    [bathroomChoiceKey(bathroomRows[1], 1)]: { fixture: "蹲坑", shower: "玻璃淋浴房" },
  },
);
