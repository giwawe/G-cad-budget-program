import assert from "node:assert/strict";
import { defaultProjectRows, defaultProjectSummary } from "./default-project.ts";
import {
  buildHealthFixListMarkdown,
  buildQuantityHealthChecks,
  filterAcceptedHealthChecks,
  filterQuantityHealthChecks,
  healthCheckKey,
  healthFixListFileName,
  summarizeQuantityHealthChecks,
} from "./quantity-health.ts";
import { EMPTY_HYDROPOWER_SUMMARY } from "./hydropower-estimate.ts";
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
    ready_count: 2,
    pending_count: 0,
    ready_space_names: ["客厅", "主卧"],
    pending_space_names: [],
  },
  curtain_quote_candidates: [],
  atrium_curtain_candidates: [],
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
    { ...baseRow, spaceName: "客厅", spaceType: "其他", status: "confirmed" },
    { ...baseRow, spaceName: "电梯井", spaceType: "其他", status: "excluded" },
    { ...baseRow, spaceName: "主卧", spaceType: "卧室", curtainWallWidthSource: "manual_required_l_shape_window" },
  ],
  summary,
  quoteMapping,
});

assert.deepEqual(checks.map((check) => check.id), ["space-type-other", "building-area-missing", "building-area-quote-missing"]);
assert.equal(checks[0].message, checks[0].detail);
assert.equal(checks[0].message.includes("被识别为其他"), true);
assert.equal(checks[1].message, "当前建筑面积为 0，请检查是否绘制了闭合 QUOTE_EXT_WALL 外墙轮廓。");
assert.equal(checks[2].message.includes("强电布线、水路布管"), true);
assert.deepEqual(summarizeQuantityHealthChecks(checks), {
  total: 3,
  warning: 3,
  info: 0,
  label: "3 项需优先处理",
});
assert.deepEqual(summarizeQuantityHealthChecks([]), {
  total: 0,
  warning: 0,
  info: 0,
  label: "当前无待确认项",
});
assert.deepEqual(buildQuantityHealthChecks({ rows: [baseRow], summary: { ...summary, building_area_m2: 88.66 } }), []);
assert.deepEqual(buildQuantityHealthChecks({ rows: defaultProjectRows, summary: defaultProjectSummary }), []);

const doorChecks = buildQuantityHealthChecks({
  rows: [
    { ...baseRow, spaceName: "公卫", spaceType: "卫生间", interiorDoorCount: 1, bathroomDoorCount: 0, doorWidthTotalM: 0.8, toiletCount: 1, bathroomVanityCount: 1 },
    { ...baseRow, spaceName: "主卧", spaceType: "卧室", interiorDoorCount: 2, bathroomDoorCount: 0, doorWidthTotalM: 1.6 },
    { ...baseRow, spaceName: "厨房", spaceType: "厨房", interiorDoorCount: 0, doorWidthTotalM: 1.4, slidingDoorAreaM2: 0, slidingDoorCasingLengthM: 0, kitchenBaseCabinetLengthM: 2.4 },
  ],
  summary: { ...summary, building_area_m2: 88.66 },
});

assert.deepEqual(doorChecks.map((check) => check.id), ["bathroom-door-classification", "kitchen-sliding-door-missing"]);
assert.deepEqual(doorChecks.map((check) => check.severity), ["warning", "info"]);
assert.equal(doorChecks[0].message.includes("卫生间门"), true);
assert.equal(doorChecks[1].message.includes("厨房推拉门"), true);

const openingAttributionChecks = buildQuantityHealthChecks({
  rows: [
    { ...baseRow, spaceName: "阳台", spaceType: "阳台", doorWidthTotalM: 1.8, slidingDoorAreaM2: 0, slidingDoorCasingLengthM: 0 },
    { ...baseRow, spaceName: "入户门厅", spaceType: "门厅", entryDoorCount: 1 },
    { ...baseRow, spaceName: "玄关", spaceType: "门厅", entryDoorCount: 1 },
    { ...baseRow, spaceName: "厨房", spaceType: "厨房", windowWidthTotalM: 1.2, windowAreaM2: 0, kitchenBaseCabinetLengthM: 2.4 },
  ],
  summary: { ...summary, building_area_m2: 88.66 },
});

assert.deepEqual(openingAttributionChecks.map((check) => check.id), ["balcony-sliding-door-missing", "entry-door-duplicate", "wet-room-window-attribution"]);
assert.deepEqual(openingAttributionChecks.map((check) => check.severity), ["info", "warning", "warning"]);

const cabinetFixtureChecks = buildQuantityHealthChecks({
  rows: [
    { ...baseRow, spaceName: "厨房", spaceType: "厨房", interiorDoorCount: 0, kitchenBaseCabinetLengthM: 0, kitchenWallCabinetLengthM: 0 },
    { ...baseRow, spaceName: "西厨房", spaceType: "厨房", interiorDoorCount: 0, kitchenBaseCabinetLengthM: 2.4, kitchenWallCabinetLengthM: 1.8, customCabinetAreaM2: 3.2 },
    { ...baseRow, spaceName: "公卫", spaceType: "卫生间", interiorDoorCount: 0, toiletCount: 0, bathroomVanityCount: 0 },
  ],
  summary: { ...summary, building_area_m2: 88.66 },
});

assert.deepEqual(cabinetFixtureChecks.map((check) => check.id), ["kitchen-cabinet-missing", "kitchen-custom-cabinet-overlap", "bathroom-fixture-missing"]);
assert.deepEqual(cabinetFixtureChecks.map((check) => check.severity), ["info", "warning", "info"]);
assert.equal(cabinetFixtureChecks[0].message.includes("QUOTE_BASE_CABINET"), true);
assert.equal(cabinetFixtureChecks[1].message.includes("全屋定制"), true);
assert.equal(cabinetFixtureChecks[2].message.includes("马桶"), true);

const zeroPriceIntegratedCeilingChecks = buildQuantityHealthChecks({
  rows: [{ ...baseRow, spaceName: "厨房", spaceType: "厨房", kitchenBaseCabinetLengthM: 1.2 }],
  summary: { ...summary, building_area_m2: 88.66 },
  quoteMapping: {
    ...quoteMapping,
    items: [
      {
        floor: "一层",
        space_name: "厨房",
        space_type: "厨房",
        item_name: "厨房卫生间集成吊顶",
        quantity: 4.48,
        unit: "m2",
        unit_price: 0,
        amount: 0,
      },
    ],
    building_area_quote_readiness: {
      building_area_m2: 88.66,
      required_item_names: [],
      missing_item_names: [],
    },
  },
});

assert.deepEqual(zeroPriceIntegratedCeilingChecks.map((check) => check.id), ["integrated-ceiling-price-missing"]);
assert.equal(zeroPriceIntegratedCeilingChecks[0].message.includes("单价为 0"), true);

const hydropowerInfo = buildQuantityHealthChecks({
  rows: [baseRow],
  summary: { ...summary, building_area_m2: 88.66 },
  hydropower: { points: [], pipes: [], summary: EMPTY_HYDROPOWER_SUMMARY, reviewStatus: "auto_estimated" },
});
assert.ok(hydropowerInfo.some((check) => check.message.includes("水电点位为系统推算")));

const hydropowerWarning = buildQuantityHealthChecks({
  rows: [baseRow],
  summary: { ...summary, building_area_m2: 88.66 },
  hydropower: { points: [], pipes: [], summary: { ...EMPTY_HYDROPOWER_SUMMARY, lowConfidencePointCount: 3 }, reviewStatus: "auto_estimated" },
});
assert.ok(hydropowerWarning.some((check) => check.message.includes("缺少坐标")));

assert.deepEqual(filterQuantityHealthChecks(cabinetFixtureChecks, "all").map((check) => check.id), [
  "kitchen-cabinet-missing",
  "kitchen-custom-cabinet-overlap",
  "bathroom-fixture-missing",
]);
assert.deepEqual(filterQuantityHealthChecks(cabinetFixtureChecks, "warning").map((check) => check.id), ["kitchen-custom-cabinet-overlap"]);
assert.deepEqual(filterQuantityHealthChecks(cabinetFixtureChecks, "info").map((check) => check.id), ["kitchen-cabinet-missing", "bathroom-fixture-missing"]);
assert.equal(healthCheckKey({ ...cabinetFixtureChecks[0], spaceNames: ["厨房", "西厨房"] }), "kitchen-cabinet-missing:厨房|西厨房");
assert.equal(healthCheckKey({ ...checks[1], spaceNames: undefined }), "building-area-missing:project");
assert.deepEqual(filterAcceptedHealthChecks(cabinetFixtureChecks, [healthCheckKey(cabinetFixtureChecks[0])]).map((check) => check.id), [
  "kitchen-custom-cabinet-overlap",
  "bathroom-fixture-missing",
]);

assert.equal(healthFixListFileName("987654.dxf"), "987654.health-fix-list.md");
assert.equal(healthFixListFileName("样例数据"), "health-fix-list.md");

const fixListMarkdown = buildHealthFixListMarkdown({
  fileName: "987654.dxf",
  checks: [checks[0], cabinetFixtureChecks[0], hydropowerWarning[1]],
  rows: [
    { ...baseRow, spaceName: "客厅", status: "needs_fix" },
    { ...baseRow, spaceName: "厨房", status: "pending_review" },
  ],
  generatedAt: new Date("2026-06-25T10:20:30Z"),
});

assert.ok(fixListMarkdown.includes("# CAD 修图清单"));
assert.ok(fixListMarkdown.includes("需优先处理"));
assert.ok(fixListMarkdown.includes("提醒"));
assert.ok(fixListMarkdown.includes("修图后复核"));
assert.ok(fixListMarkdown.includes("客厅=需修图"));
