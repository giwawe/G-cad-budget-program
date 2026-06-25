import assert from "node:assert/strict";
import { buildHealthFixListMarkdown, filterQuantityHealthChecks, healthFixListFileName, buildQuantityHealthChecks, summarizeQuantityHealthChecks } from "./quantity-health.ts";
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
  quantity_health_readiness: {
    total: 0,
    warning: 0,
    info: 0,
    label: "当前无待确认项",
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
assert.deepEqual(summarizeQuantityHealthChecks(checks), {
  total: 4,
  warning: 4,
  info: 0,
  label: "4 项需优先处理",
});

assert.deepEqual(summarizeQuantityHealthChecks([]), {
  total: 0,
  warning: 0,
  info: 0,
  label: "当前无待确认项",
});
assert.deepEqual(buildQuantityHealthChecks({ rows: [baseRow], summary: { ...summary, building_area_m2: 88.66 } }), []);

const doorChecks = buildQuantityHealthChecks({
  rows: [
    { ...baseRow, spaceName: "公卫", spaceType: "卫生间", interiorDoorCount: 1, bathroomDoorCount: 0, doorWidthTotalM: 0.8, toiletCount: 1, bathroomVanityCount: 1 },
    { ...baseRow, spaceName: "主卧", spaceType: "卧室", interiorDoorCount: 2, bathroomDoorCount: 0, doorWidthTotalM: 1.6 },
    { ...baseRow, spaceName: "厨房", spaceType: "厨房", interiorDoorCount: 0, doorWidthTotalM: 1.4, slidingDoorAreaM2: 0, slidingDoorCasingLengthM: 0, kitchenBaseCabinetLengthM: 2.4 },
  ],
  summary: { ...summary, building_area_m2: 88.66 },
});

assert.deepEqual(doorChecks.map((check) => check.id), [
  "bathroom-door-classification",
  "bedroom-interior-door-duplicate",
  "kitchen-sliding-door-missing",
]);
assert.deepEqual(doorChecks[0], {
  id: "bathroom-door-classification",
  severity: "warning",
  title: "卫生间门分类待确认",
  detail: "公卫 出现室内门数量，可能应归为卫生间门，避免室内门重复报价。",
  spaceNames: ["公卫"],
});
assert.equal(doorChecks[1].detail, "主卧 室内门数量超过 1，可能和套内卫生间门重复。");
assert.equal(doorChecks[2].severity, "info");
assert.equal(doorChecks[2].detail, "厨房 有 1.20m 以上门洞但推拉门面积或门套为 0，请确认是否应生成厨房推拉门报价。");

const cabinetFixtureChecks = buildQuantityHealthChecks({
  rows: [
    { ...baseRow, spaceName: "厨房", spaceType: "厨房", interiorDoorCount: 0, kitchenBaseCabinetLengthM: 0, kitchenWallCabinetLengthM: 0 },
    { ...baseRow, spaceName: "西厨", spaceType: "厨房", interiorDoorCount: 0, kitchenBaseCabinetLengthM: 2.4, kitchenWallCabinetLengthM: 1.8, customCabinetAreaM2: 3.2 },
    { ...baseRow, spaceName: "公卫", spaceType: "卫生间", interiorDoorCount: 0, toiletCount: 0, bathroomVanityCount: 0 },
  ],
  summary: { ...summary, building_area_m2: 88.66 },
});

assert.deepEqual(cabinetFixtureChecks.map((check) => check.id), [
  "kitchen-cabinet-missing",
  "kitchen-custom-cabinet-overlap",
  "bathroom-fixture-missing",
]);
assert.deepEqual(cabinetFixtureChecks.map((check) => check.severity), ["info", "warning", "info"]);
assert.deepEqual(summarizeQuantityHealthChecks(cabinetFixtureChecks), {
  total: 3,
  warning: 1,
  info: 2,
  label: "1 项需优先处理，2 项提醒",
});
assert.equal(cabinetFixtureChecks[0].detail, "厨房 橱柜地柜和吊柜长度都为 0，如需橱柜报价请检查 QUOTE_BASE_CABINET / QUOTE_WALL_CABINET。");
assert.equal(cabinetFixtureChecks[1].detail, "西厨 厨房空间出现全屋定制面积，可能和橱柜地柜/吊柜重复计价。");
assert.equal(cabinetFixtureChecks[2].detail, "公卫 马桶或浴室柜数量为 0，请确认是否应按默认 1 个/1 套或补画点位。");
assert.deepEqual(filterQuantityHealthChecks(cabinetFixtureChecks, "all").map((check) => check.id), [
  "kitchen-cabinet-missing",
  "kitchen-custom-cabinet-overlap",
  "bathroom-fixture-missing",
]);
assert.deepEqual(filterQuantityHealthChecks(cabinetFixtureChecks, "warning").map((check) => check.id), ["kitchen-custom-cabinet-overlap"]);
assert.deepEqual(filterQuantityHealthChecks(cabinetFixtureChecks, "info").map((check) => check.id), ["kitchen-cabinet-missing", "bathroom-fixture-missing"]);

assert.equal(healthFixListFileName("987654.dxf"), "987654.health-fix-list.md");
assert.equal(healthFixListFileName("样例数据"), "health-fix-list.md");

const fixListMarkdown = buildHealthFixListMarkdown({
  fileName: "987654.dxf",
  checks: [checks[0], cabinetFixtureChecks[0]],
  rows: [
    { ...baseRow, spaceName: "客卧", status: "needs_fix" },
    { ...baseRow, spaceName: "厨房", status: "pending_review" },
  ],
  generatedAt: new Date("2026-06-25T10:20:30Z"),
});

assert.equal(fixListMarkdown, `# CAD 修图清单

来源文件：987654.dxf
生成时间：2026-06-25T10:20:30.000Z
检查结果：1 项需优先处理，1 项提醒

## 需优先处理

1. 空间类型待确认
   - 级别：warning
   - 涉及空间：客卧
   - 当前状态：客卧=需修图
   - 问题：客卧 被识别为其他，需改名或补充关键词，避免报价项目缺失。
   - 建议：检查空间名称和 QUOTE_TEXT，必要时改名或补充空间分类关键词。

## 提醒

1. 厨房橱柜待确认
   - 级别：info
   - 涉及空间：厨房
   - 当前状态：厨房=待确认
   - 问题：厨房 橱柜地柜和吊柜长度都为 0，如需橱柜报价请检查 QUOTE_BASE_CABINET / QUOTE_WALL_CABINET。
   - 建议：如需要橱柜报价，在实际地柜/吊柜位置补画对应柜体延米线。

## 修图后复核

1. CAD 修图完成后，请重新上传 DXF 并复查算量健康检查。
2. 若仍有 warning，请先处理后再导出正式报价映射。
`);
