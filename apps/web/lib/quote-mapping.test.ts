import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  apartmentPendingQuoteMetrics,
  buildQuoteMapping,
  curtainQuoteReadiness,
  DEFAULT_QUOTE_RULES_NAME,
  defaultQuoteRules,
  formatCurtainReadinessSpaces,
  parseQuoteRules,
  quoteMappingFileName,
  quoteRulesTemplateFileName,
} from "./quote-mapping.ts";
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
    newWallLengthM: 0,
    newWallAreaM2: 0,
    demolitionWallLengthM: 0,
    demolitionWallAreaM2: 0,
    interiorDoorCount: 0,
    waterproofAreaM2: 7.22,
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
    windowsillLengthM: 0,
    curtainWallWidthM: 0,
    curtainWallWidthSource: "not_applicable",
    windowAreaM2: 0,
    doorWidthTotalM: 0,
    doorDeductAreaM2: 0,
    wallGrossAreaM2: 0,
    latexPaintAreaM2: 0,
    wallTileMeasureLengthM: 0,
    wallTileAreaM2: 0,
    newWallLengthM: 0,
    newWallAreaM2: 0,
    demolitionWallLengthM: 0,
    demolitionWallAreaM2: 0,
    interiorDoorCount: 0,
    waterproofAreaM2: 0,
    evidence: "",
    anomalies: [],
    status: "excluded",
  },
];

const mapping = buildQuoteMapping(rows);

assert.equal(mapping.items.length, 4);
assert.equal(mapping.items[0].space_name, "厨房");
assert.equal(mapping.items[0].space_type, "厨房");
assert.deepEqual(mapping.items.map((item) => item.item_name), [
  "地面找平",
  "地面砖铺贴(750X1500)",
  "墙面贴瓷砖(600X1200)",
  "墙地面防漏处理",
]);
assert.equal(mapping.items[0].quantity, 4.48);
assert.equal(mapping.items[0].unit_price, 56);
assert.equal(mapping.items[0].amount, 250.88);
assert.equal(mapping.items[2].quantity, 20.7);
assert.equal(mapping.items[2].amount, 2070);
assert.equal(mapping.items[3].quantity, 7.22);
assert.equal(mapping.items[3].amount, 371.83);
assert.equal(mapping.summary.item_count, 4);
assert.equal(mapping.summary.space_count, 1);
assert.equal(mapping.summary.total_amount, 3122.79);

const bedroomDefaultMapping = buildQuoteMapping([{ ...rows[0], spaceName: "主卧", spaceType: "卧室", wallTileAreaM2: 0, waterproofAreaM2: 0 }]);

assert.equal(bedroomDefaultMapping.items.length, 7);
assert.deepEqual(bedroomDefaultMapping.items.map((item) => item.item_name), [
  "墙面界面剂处理",
  "墙面批嵌",
  "墙面乳胶漆",
  "轻钢龙骨平顶",
  "顶面批嵌",
  "顶面乳胶漆",
  "地面砖铺贴(750X1500)",
]);
assert.equal(bedroomDefaultMapping.summary.total_amount, 2766.16);

const customMapping = buildQuoteMapping(rows, [{ item_name: "厨房墙面定制漆", metric: "latex_paint_area_m2", unit: "m2", unit_price: 30 }]);

assert.equal(customMapping.items.length, 1);
assert.equal(customMapping.items[0].item_name, "厨房墙面定制漆");
assert.equal(customMapping.items[0].quantity, 25.54);
assert.equal(customMapping.items[0].unit_price, 30);
assert.equal(customMapping.items[0].amount, 766.2);
assert.equal(customMapping.summary.total_amount, 766.2);

const bedroomRows: QuantityRow[] = [
  { ...rows[0], spaceName: "主卧", spaceType: "卧室", latexPaintAreaM2: 30, wallTileAreaM2: 0, waterproofAreaM2: 0 },
  { ...rows[0], spaceName: "厨房", spaceType: "厨房", latexPaintAreaM2: 20 },
];
const dryAreaMapping = buildQuoteMapping(bedroomRows, [
  { item_name: "墙面乳胶漆", metric: "latex_paint_area_m2", unit: "m2", unit_price: 20, space_types: ["卧室", "客厅"] },
]);

assert.equal(dryAreaMapping.items.length, 1);
assert.equal(dryAreaMapping.items[0].space_name, "主卧");
assert.equal(dryAreaMapping.summary.total_amount, 600);

const rules = defaultQuoteRules();
assert.equal(DEFAULT_QUOTE_RULES_NAME, "商品房整装默认规则");
assert.equal(rules.length, 15);
assert.equal(rules[0].item_name, "墙面界面剂处理");
assert.equal(rules[0].metric, "latex_paint_area_m2");
assert.equal(rules[0].unit_price, 7);
assert.deepEqual(rules.find((rule) => rule.item_name === "墙面贴瓷砖(600X1200)")?.space_types, ["厨房", "卫生间", "阳台", "露台", "洗衣房"]);
assert.deepEqual(rules.at(-1), {
  item_name: "暗窗帘箱",
  metric: "curtain_wall_width_m",
  unit: "M",
  unit_price: 110,
  space_types: ["客厅", "卧室", "书房"],
});
assert.deepEqual(rules.find((rule) => rule.item_name === "砌120厚砖墙"), {
  item_name: "砌120厚砖墙",
  metric: "new_wall_area_m2",
  unit: "M2",
  unit_price: 170,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "拆改及拆墙"), {
  item_name: "拆改及拆墙",
  metric: "demolition_wall_area_m2",
  unit: "M2",
  unit_price: 60,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "室内门"), {
  item_name: "室内门",
  metric: "interior_door_count",
  unit: "樘",
  unit_price: 1200,
  space_types: undefined,
});
assert.deepEqual(rules[0].space_types, ["客厅", "餐厅", "卧室", "书房", "过道", "门厅", "楼梯过道", "衣帽间", "储物间", "露台"]);
rules[0].unit_price = 99;
rules[0].space_types?.push("厨房");
assert.equal(defaultQuoteRules()[0].unit_price, 7);
assert.deepEqual(defaultQuoteRules()[0].space_types, ["客厅", "餐厅", "卧室", "书房", "过道", "门厅", "楼梯过道", "衣帽间", "储物间", "露台"]);

const apartmentRules = parseQuoteRules(readFileSync(new URL("../../../quote-rules-apartment-current.json", import.meta.url), "utf8"));
assert.deepEqual(apartmentRules, defaultQuoteRules());

const pendingMetricGroups = new Set(apartmentPendingQuoteMetrics().map((item) => item.source_group));
assert.ok(!pendingMetricGroups.has("防水"));
assert.ok(!pendingMetricGroups.has("窗台石"));
assert.ok(!pendingMetricGroups.has("窗帘箱"));
assert.ok(!pendingMetricGroups.has("墙砖"));
for (const expectedGroup of ["水电", "洁具", "定制", "主材", "套装项"]) {
  assert.ok(pendingMetricGroups.has(expectedGroup), `missing pending group: ${expectedGroup}`);
}
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "砌120厚砖墙"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "拆改及拆墙"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "室内门"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name.includes("阳台") && item.suggested_metric === "wall_tile_marked_area_m2"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "暗窗帘箱"));

const parsedRules = parseQuoteRules(JSON.stringify([{ item_name: "地面找平", metric: "floor_area_m2", unit: "m2", unit_price: 18, space_types: ["厨房", "卫生间"] }]));
assert.equal(parsedRules[0].item_name, "地面找平");
assert.equal(parsedRules[0].unit_price, 18);
assert.deepEqual(parsedRules[0].space_types, ["厨房", "卫生间"]);

const parsedWetRules = parseQuoteRules(JSON.stringify([
  { item_name: "墙面贴瓷砖(600X1200)", metric: "wall_tile_area_m2", unit: "m2", unit_price: 100, space_types: ["厨房", "卫生间"] },
  { item_name: "墙地面防漏处理", metric: "waterproof_area_m2", unit: "m2", unit_price: 51.5, space_types: ["厨房", "卫生间", "阳台"] },
  { item_name: "窗台石铺贴", metric: "windowsill_length_m", unit: "M", unit_price: 73 },
  { item_name: "暗窗帘箱", metric: "curtain_wall_width_m", unit: "M", unit_price: 110, space_types: ["卧室"] },
]));
assert.equal(parsedWetRules[0].metric, "wall_tile_area_m2");
assert.equal(parsedWetRules[1].metric, "waterproof_area_m2");
assert.equal(parsedWetRules[2].metric, "windowsill_length_m");
assert.equal(parsedWetRules[3].metric, "curtain_wall_width_m");

const balconyMapping = buildQuoteMapping([{ ...rows[0], spaceName: "阳台", spaceType: "阳台", wallTileAreaM2: 0, waterproofAreaM2: 9 }]);
assert.deepEqual(balconyMapping.items.map((item) => item.item_name), ["地面找平", "地面砖铺贴(750X1500)", "墙地面防漏处理"]);

const tiledBalconyMapping = buildQuoteMapping([{ ...rows[0], spaceName: "阳台", spaceType: "阳台", wallTileAreaM2: 14, waterproofAreaM2: 9 }]);
assert.deepEqual(tiledBalconyMapping.items.map((item) => item.item_name), ["地面找平", "地面砖铺贴(750X1500)", "墙面贴瓷砖(600X1200)", "墙地面防漏处理"]);

const newWallMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", wallTileAreaM2: 0, waterproofAreaM2: 0, newWallAreaM2: 11.2 }]);
assert.deepEqual(newWallMapping.items.filter((item) => item.item_name === "砌120厚砖墙"), [
  {
    floor: "一层",
    space_name: "客厅",
    space_type: "客厅",
    item_name: "砌120厚砖墙",
    quantity: 11.2,
    unit: "M2",
    unit_price: 170,
    amount: 1904,
  },
]);

const demolitionWallMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", wallTileAreaM2: 0, waterproofAreaM2: 0, demolitionWallAreaM2: 11.2 }]);
assert.deepEqual(demolitionWallMapping.items.filter((item) => item.item_name === "拆改及拆墙"), [
  {
    floor: "一层",
    space_name: "客厅",
    space_type: "客厅",
    item_name: "拆改及拆墙",
    quantity: 11.2,
    unit: "M2",
    unit_price: 60,
    amount: 672,
  },
]);

const interiorDoorMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", wallTileAreaM2: 0, waterproofAreaM2: 0, interiorDoorCount: 2 }]);
assert.deepEqual(interiorDoorMapping.items.filter((item) => item.item_name === "室内门"), [
  {
    floor: "一层",
    space_name: "客厅",
    space_type: "客厅",
    item_name: "室内门",
    quantity: 2,
    unit: "樘",
    unit_price: 1200,
    amount: 2400,
  },
]);

const windowedBedroomMapping = buildQuoteMapping([{ ...rows[0], spaceName: "主卧", spaceType: "卧室", windowWidthTotalM: 1.8, windowsillLengthM: 1.8, wallTileAreaM2: 0, waterproofAreaM2: 0 }]);
assert.equal(windowedBedroomMapping.items.at(-1)?.item_name, "窗台石铺贴");
assert.equal(windowedBedroomMapping.items.at(-1)?.quantity, 1.8);
assert.equal(windowedBedroomMapping.items.at(-1)?.amount, 131.4);

const curtainReadiness = curtainQuoteReadiness([
  { ...rows[0], spaceName: "主卧", spaceType: "卧室", curtainWallWidthM: 4.2, curtainWallWidthSource: "manual" },
  { ...rows[0], spaceName: "次卧", spaceType: "卧室", curtainWallWidthM: 3.6, curtainWallWidthSource: "matched_window_wall" },
  { ...rows[0], spaceName: "书房", spaceType: "书房", curtainWallWidthM: 3.2, curtainWallWidthSource: "fallback_longest_wall" },
  { ...rows[0], spaceName: "客厅", spaceType: "客厅", curtainWallWidthM: 0, curtainWallWidthSource: "manual_required_l_shape_window" },
  { ...rows[1], spaceName: "电梯井", curtainWallWidthM: 5, curtainWallWidthSource: "manual" },
]);

assert.deepEqual(curtainReadiness, {
  ready_count: 2,
  pending_count: 2,
  ready_space_names: ["主卧", "次卧"],
  pending_space_names: ["书房", "客厅"],
});
assert.equal(formatCurtainReadinessSpaces(["主卧", "次卧"]), "主卧、次卧");
assert.equal(formatCurtainReadinessSpaces(["主卧", "次卧", "书房", "客厅", "南卧"]), "主卧、次卧、书房、客厅等 5 个");
assert.equal(formatCurtainReadinessSpaces([]), "暂无");

const curtainCandidateMapping = buildQuoteMapping([
  { ...rows[0], spaceName: "主卧", spaceType: "卧室", curtainWallWidthM: 4.2, curtainWallWidthSource: "manual" },
  { ...rows[0], spaceName: "次卧", spaceType: "卧室", curtainWallWidthM: 3.6, curtainWallWidthSource: "matched_window_wall" },
  { ...rows[0], spaceName: "客厅", spaceType: "客厅", curtainWallWidthM: 0, curtainWallWidthSource: "manual_required_l_shape_window" },
]);
assert.deepEqual(curtainCandidateMapping.curtain_quote_readiness, {
  ready_count: 2,
  pending_count: 1,
  ready_space_names: ["主卧", "次卧"],
  pending_space_names: ["客厅"],
});
assert.deepEqual(curtainCandidateMapping.curtain_quote_candidates, [
  {
    floor: "一层",
    space_name: "主卧",
    space_type: "卧室",
    item_name: "暗窗帘箱",
    quantity: 4.2,
    unit: "M",
    unit_price: 110,
    source: "manual",
    note: "人工确认后已进入金额汇总",
  },
]);
assert.deepEqual(curtainCandidateMapping.items.filter((item) => item.item_name === "暗窗帘箱"), [
  {
    floor: "一层",
    space_name: "主卧",
    space_type: "卧室",
    item_name: "暗窗帘箱",
    quantity: 4.2,
    unit: "M",
    unit_price: 110,
    amount: 462,
  },
]);
assert.equal(curtainCandidateMapping.summary.total_amount, 8760.48);

assert.throws(() => parseQuoteRules("{bad json"), /报价规则 JSON 格式无效/);
assert.throws(() => parseQuoteRules(JSON.stringify({ item_name: "x" })), /报价规则必须是数组/);
assert.throws(() => parseQuoteRules(JSON.stringify([{ item_name: "x", metric: "bad", unit: "m2", unit_price: 1 }])), /报价规则 metric 无效/);
assert.throws(() => parseQuoteRules(JSON.stringify([{ item_name: "x", metric: "floor_area_m2", unit: "m2", unit_price: -1 }])), /报价规则 unit_price 无效/);
assert.throws(() => parseQuoteRules(JSON.stringify([{ item_name: "x", metric: "floor_area_m2", unit: "m2", unit_price: 1, space_types: [""] }])), /报价规则 space_types 无效/);

assert.equal(quoteMappingFileName("test-case.dxf"), "test-case.quote-mapping.json");
assert.equal(quoteMappingFileName("样例数据"), "quote-mapping.json");
assert.equal(quoteRulesTemplateFileName("test-case.dxf"), "test-case.quote-rules.json");
assert.equal(quoteRulesTemplateFileName("样例数据"), "quote-rules.json");
