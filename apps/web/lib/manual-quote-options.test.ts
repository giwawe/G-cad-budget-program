import assert from "node:assert/strict";
import { applyExclusiveManualQuoteChoice, bathroomCountFromRows, manualQuoteInputsFromQuantities, manualQuoteQuantitiesFromInputs } from "./manual-quote-options.ts";
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

assert.equal(
  bathroomCountFromRows([
    { ...baseRow, spaceName: "卫生间", spaceType: "卫生间" },
    { ...baseRow, spaceName: "主卫", spaceType: "卫生间", status: "confirmed" },
    { ...baseRow, spaceName: "设备间", spaceType: "卫生间", status: "excluded" },
  ]),
  2,
);

assert.deepEqual(manualQuoteQuantitiesFromInputs({ 入户门: "1", 马桶: "2.345", 蹲坑: "-1", 窗台石: "", 铝合金封门窗: "bad" }), {
  入户门: 1,
  马桶: 2.35,
});

assert.deepEqual(manualQuoteInputsFromQuantities({ 入户门: 1, 马桶: 2 }), { 入户门: "1", 马桶: "2" });

assert.deepEqual(applyExclusiveManualQuoteChoice({ 入户门: "1" }, ["马桶", "蹲坑"], "蹲坑", 2), {
  入户门: "1",
  马桶: "0",
  蹲坑: "2",
});

assert.deepEqual(applyExclusiveManualQuoteChoice({ 淋浴隔断: "1", 玻璃淋浴房: "0" }, ["淋浴隔断", "玻璃淋浴房"], "玻璃淋浴房", 0), {
  淋浴隔断: "0",
  玻璃淋浴房: "0",
});
