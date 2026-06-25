import assert from "node:assert/strict";
import { buildQuantityHealthChecks } from "./quantity-health.ts";
import type { QuantityRow, QuantitySummary } from "./types.ts";
import type { QuoteMapping } from "./quote-mapping.ts";

const baseRow: QuantityRow = {
  floor: "一层",
  spaceName: "客厅",
  spaceType: "客厅",
  floorAreaM2: 20,
  ceilingAreaM2: 20,
  wallMeasureLengthM: 18,
  heightM: 2.8,
  windowWidthTotalM: 2,
  windowsillLengthM: 2,
  curtainWallWidthM: 0,
  curtainWallWidthSource: "not_applicable",
  windowAreaM2: 3,
  doorWidthTotalM: 1,
  doorDeductAreaM2: 0,
  wallGrossAreaM2: 50.4,
  latexPaintAreaM2: 47.4,
  wallTileMeasureLengthM: 0,
  wallTileAreaM2: 0,
  floorTilePieceCount: 19,
  electricalScopeAreaM2: 20,
  plumbingScopeAreaM2: 20,
  newWallLengthM: 0,
  newWallAreaM2: 0,
  demolitionWallLengthM: 0,
  demolitionWallAreaM2: 0,
  interiorDoorCount: 1,
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
  status: "confirmed",
};

const summary: QuantitySummary = {
  space_count: 3,
  building_area_m2: 0,
  floor_area_total_m2: 48,
  wall_measure_length_total_m: 44,
  window_area_total_m2: 6,
  latex_paint_area_total_m2: 120,
};

const quoteMapping: QuoteMapping = {
  items: [],
  summary: {
    space_count: 3,
    building_area_m2: 0,
    item_count: 0,
    total_amount: 0,
  },
  curtain_quote_readiness: {
    ready_count: 0,
    pending_count: 2,
    ready_space_names: [],
    pending_space_names: ["客厅", "主卧"],
  },
  curtain_quote_candidates: [],
  building_area_quote_readiness: {
    building_area_m2: 0,
    required_item_names: ["强电布线", "水路布管"],
    missing_item_names: ["强电布线", "水路布管"],
  },
};

const checks = buildQuantityHealthChecks({
  rows: [
    baseRow,
    { ...baseRow, spaceName: "客卧", spaceType: "其他", status: "confirmed" },
    { ...baseRow, spaceName: "电梯井", spaceType: "其他", status: "excluded" },
    { ...baseRow, spaceName: "主卧", spaceType: "卧室", curtainWallWidthSource: "manual_required_l_shape_window" },
  ],
  summary,
  quoteMapping,
});

assert.deepEqual(checks.map((check) => check.id), [
  "space-type-other",
  "building-area-missing",
  "curtain-wall-width-pending",
  "building-area-quote-missing",
]);
assert.deepEqual(checks[0], {
  id: "space-type-other",
  severity: "warning",
  title: "空间类型待确认",
  detail: "客卧 被识别为其他，需改名或补充关键词，避免报价项目缺失。",
  spaceNames: ["客卧"],
});
assert.equal(checks[1].detail, "当前建筑面积为 0，请检查是否绘制了闭合 QUOTE_EXT_WALL 外墙轮廓。");
assert.equal(checks[2].detail, "客厅、主卧 需要人工确认窗帘/窗帘箱延米，确认后暗窗帘箱才进入金额汇总。");
assert.equal(checks[3].detail, "强电布线、水路布管 依赖建筑面积，当前未进入金额汇总。");

assert.deepEqual(buildQuantityHealthChecks({ rows: [baseRow], summary: { ...summary, building_area_m2: 88.66 } }), []);
