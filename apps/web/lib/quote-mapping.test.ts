import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  apartmentPendingQuoteMetrics,
  buildQuoteMapping,
  curtainQuoteReadiness,
  DEFAULT_QUOTE_RULES_NAME,
  defaultQuoteRules,
  exportQuoteMappingConfirmationMessages,
  formatCurtainReadinessSpaces,
  integratedCeilingPriceReminderItems,
  projectSummaryQuoteItems,
  parseQuoteRules,
  quoteMappingFileName,
  quoteRulesTemplateFileName,
  updateQuoteRuleUnitPrice,
} from "./quote-mapping.ts";
import type { QuantityRow } from "./types.ts";

const rows: QuantityRow[] = [
  {
    floor: "一层",
    spaceName: "厨房",
    spaceType: "厨房",
    floorAreaM2: 4.48,
    ceilingAreaM2: 4.48,
    ceilingFinishType: "integrated",
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
    latexPaintAreaM2: 0,
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
    kitchenBaseCabinetLengthM: 4.3,
    kitchenWallCabinetLengthM: 3.0,
    toiletCount: 0,
    bathroomVanityCount: 0,
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
    floorTilePieceCount: 0,
    electricalScopeAreaM2: 3.24,
    plumbingScopeAreaM2: 3.24,
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
    waterproofAreaM2: 0,
    evidence: "",
    anomalies: [],
    status: "excluded",
  },
];

const mapping = buildQuoteMapping(rows, undefined, { building_area_m2: 88.66 });

function curtainOnlyRow(spaceName: string, spaceType: string, curtainWallWidthM: number, curtainWallWidthSource: QuantityRow["curtainWallWidthSource"]): QuantityRow {
  return {
    ...rows[0],
    spaceName,
    spaceType,
    floorAreaM2: 0,
    ceilingAreaM2: 0,
    wallMeasureLengthM: 0,
    windowWidthTotalM: 0,
    windowsillLengthM: 0,
    curtainWallWidthM,
    curtainWallWidthSource,
    windowAreaM2: 0,
    doorWidthTotalM: 0,
    doorDeductAreaM2: 0,
    wallGrossAreaM2: 0,
    latexPaintAreaM2: 0,
    wallTileMeasureLengthM: 0,
    wallTileAreaM2: 0,
    floorTilePieceCount: 0,
    electricalScopeAreaM2: 0,
    plumbingScopeAreaM2: 0,
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
    waterproofAreaM2: 0,
  };
}

assert.deepEqual(mapping.quantity_health_readiness, {
  total: 0,
  warning: 0,
  info: 0,
  label: "当前无待确认项",
});
assert.equal(mapping.items.length, 18);
assert.equal(mapping.items[0].space_name, "厨房");
assert.equal(mapping.items[0].space_type, "厨房");
assert.deepEqual(mapping.items.map((item) => item.item_name), [
  "厨房卫生间集成吊顶",
  "地面找平",
  "地面砖铺贴(750X1500)",
  "墙面贴瓷砖(600X1200)",
  "墙地面防漏处理",
  "地面瓷砖",
  "瓷砖加工费",
  "美缝",
  "强电布线",
  "弱电布线",
  "水路布管",
  "材料搬运费",
  "垃圾清运费",
  "地面砖现场维护费",
  "橱柜",
  "全屋插座开关",
  "全屋灯饰",
  "全屋保洁",
]);
assert.equal(mapping.items[0].quantity, 4.48);
assert.equal(mapping.items[0].unit_price, 260);
assert.equal(mapping.items[0].amount, 1164.8);
assert.equal(mapping.items[1].quantity, 4.48);
assert.equal(mapping.items[1].unit_price, 56);
assert.equal(mapping.items[1].amount, 250.88);
assert.equal(mapping.items[3].quantity, 20.7);
assert.equal(mapping.items[3].amount, 2070);
assert.equal(mapping.items[4].quantity, 7.22);
assert.equal(mapping.items[4].amount, 371.83);
assert.deepEqual(mapping.items.slice(5, 18).map((item) => item.space_name), [
  "全屋",
  "全屋",
  "全屋",
  "全屋",
  "全屋",
  "全屋",
  "全屋",
  "全屋",
  "全屋",
  "全屋",
  "全屋",
  "全屋",
  "全屋",
]);
assert.equal(mapping.items[5].quantity, 5);
assert.equal(mapping.items[5].amount, 250);
assert.equal(mapping.items[6].quantity, 25.18);
assert.equal(mapping.items[6].amount, 503.6);
assert.equal(mapping.items[7].quantity, 25.18);
assert.equal(mapping.items[7].amount, 302.16);
assert.equal(mapping.items[8].quantity, 88.66);
assert.equal(mapping.items[8].amount, 6915.48);
assert.equal(mapping.items[9].quantity, 88.66);
assert.equal(mapping.items[9].amount, 2216.5);
assert.equal(mapping.items[10].quantity, 88.66);
assert.equal(mapping.items[10].amount, 2615.47);
assert.equal(mapping.items[11].quantity, 88.66);
assert.equal(mapping.items[11].amount, 709.28);
assert.equal(mapping.items[12].quantity, 88.66);
assert.equal(mapping.items[12].amount, 886.6);
assert.equal(mapping.items[13].quantity, 88.66);
assert.equal(mapping.items[13].amount, 709.28);
assert.equal(mapping.items[14].quantity, 7.3);
assert.equal(mapping.items[14].amount, 4380);
assert.deepEqual(mapping.items[15], {
  floor: "全屋",
  space_name: "全屋",
  space_type: "全屋",
  item_name: "全屋插座开关",
  quantity: 1,
  unit: "套",
  unit_price: 6000,
  amount: 6000,
});
assert.deepEqual(mapping.items[16], {
  floor: "全屋",
  space_name: "全屋",
  space_type: "全屋",
  item_name: "全屋灯饰",
  quantity: 1,
  unit: "套",
  unit_price: 15000,
  amount: 15000,
});
assert.deepEqual(mapping.items[17], {
  floor: "全屋",
  space_name: "全屋",
  space_type: "全屋",
  item_name: "全屋保洁",
  quantity: 1,
  unit: "套",
  unit_price: 4500,
  amount: 4500,
});
assert.deepEqual(projectSummaryQuoteItems(mapping), [
  mapping.items[5],
  mapping.items[6],
  mapping.items[7],
  mapping.items[8],
  mapping.items[9],
  mapping.items[10],
  mapping.items[11],
  mapping.items[12],
  mapping.items[13],
  mapping.items[14],
  mapping.items[15],
  mapping.items[16],
  mapping.items[17],
]);
assert.equal(mapping.summary.item_count, 18);
assert.equal(mapping.summary.space_count, 1);
assert.equal(mapping.summary.total_amount, 49275.96);

const excludedOnlyMapping = buildQuoteMapping([rows[1]]);

assert.equal(excludedOnlyMapping.items.length, 0);
assert.equal(excludedOnlyMapping.summary.total_amount, 0);

const bedroomDefaultMapping = buildQuoteMapping([{ ...rows[0], spaceName: "主卧", spaceType: "卧室", latexPaintAreaM2: 25.54, wallTileAreaM2: 0, waterproofAreaM2: 0, customCabinetAreaM2: 9.8, kitchenBaseCabinetLengthM: 0, kitchenWallCabinetLengthM: 0 }], undefined, { building_area_m2: 88.66 });

assert.equal(bedroomDefaultMapping.items.length, 20);
assert.deepEqual(bedroomDefaultMapping.items.map((item) => item.item_name), [
  "墙面界面剂处理",
  "墙面批嵌",
  "墙面乳胶漆",
  "轻钢龙骨平顶",
  "顶面批嵌",
  "顶面乳胶漆",
  "地面砖铺贴(750X1500)",
  "全屋定制",
  "地面瓷砖",
  "瓷砖加工费",
  "美缝",
  "强电布线",
  "弱电布线",
  "水路布管",
  "材料搬运费",
  "垃圾清运费",
  "地面砖现场维护费",
  "全屋插座开关",
  "全屋灯饰",
  "全屋保洁",
]);
assert.deepEqual(bedroomDefaultMapping.items.filter((item) => ["地面瓷砖", "瓷砖加工费", "美缝", "强电布线", "弱电布线", "水路布管"].includes(item.item_name)).map((item) => item.space_name), ["全屋", "全屋", "全屋", "全屋", "全屋", "全屋"]);
assert.equal(bedroomDefaultMapping.summary.total_amount, 48592.13);

const livingRoomWallTileMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", wallTileAreaM2: 11.2, waterproofAreaM2: 0, customCabinetAreaM2: 0, kitchenBaseCabinetLengthM: 0, kitchenWallCabinetLengthM: 0 }]);
assert.ok(livingRoomWallTileMapping.items.some((item) => item.space_name === "客厅" && item.item_name === "墙面贴瓷砖(600X1200)" && item.quantity === 11.2));

const kitchenDefaultMapping = buildQuoteMapping([rows[0]]);
assert.ok(kitchenDefaultMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "墙面贴瓷砖(600X1200)"));
assert.ok(kitchenDefaultMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "墙地面防漏处理"));
assert.ok(kitchenDefaultMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "厨房卫生间集成吊顶" && item.quantity === 4.48 && item.unit_price === 260));
assert.ok(!kitchenDefaultMapping.items.some((item) => item.space_name === "厨房" && ["墙面乳胶漆", "顶面批嵌", "顶面乳胶漆"].includes(item.item_name)));
assert.deepEqual(integratedCeilingPriceReminderItems(kitchenDefaultMapping), []);

const kitchenGypsumCeilingMapping = buildQuoteMapping([{ ...rows[0], ceilingFinishType: "gypsum" }]);
assert.ok(!kitchenGypsumCeilingMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "厨房卫生间集成吊顶"));
assert.ok(kitchenGypsumCeilingMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "顶面批嵌" && item.quantity === 4.48));
assert.ok(kitchenGypsumCeilingMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "顶面乳胶漆" && item.quantity === 4.48));
assert.deepEqual(integratedCeilingPriceReminderItems(kitchenGypsumCeilingMapping), []);

const customMapping = buildQuoteMapping(rows, [{ item_name: "厨房墙面定制漆", metric: "latex_paint_area_m2", unit: "m2", unit_price: 30 }]);

assert.equal(customMapping.items.length, 0);
assert.equal(customMapping.summary.total_amount, 0);

const buildingAreaMapping = buildQuoteMapping(
  rows,
  [{ item_name: "按建筑面积计价项目", metric: "building_area_m2", unit: "m2", unit_price: 10 }],
  { building_area_m2: 88.66 },
);

assert.deepEqual(buildingAreaMapping.items, [
  {
    floor: "全屋",
    space_name: "全屋",
    space_type: "全屋",
    item_name: "按建筑面积计价项目",
    quantity: 88.66,
    unit: "m2",
    unit_price: 10,
    amount: 886.6,
  },
]);
assert.equal(buildingAreaMapping.summary.building_area_m2, 88.66);
assert.equal(buildingAreaMapping.summary.total_amount, 886.6);
assert.deepEqual(buildingAreaMapping.building_area_quote_readiness, {
  building_area_m2: 88.66,
  required_item_names: ["按建筑面积计价项目"],
  missing_item_names: [],
});
const missingBuildingAreaMapping = buildQuoteMapping(rows, [{ item_name: "按建筑面积计价项目", metric: "building_area_m2", unit: "m2", unit_price: 10 }]);
assert.equal(missingBuildingAreaMapping.items.length, 0);
assert.deepEqual(missingBuildingAreaMapping.building_area_quote_readiness, {
  building_area_m2: 0,
  required_item_names: ["按建筑面积计价项目"],
  missing_item_names: ["按建筑面积计价项目"],
});

const riskyMapping = buildQuoteMapping(rows, undefined, { building_area_m2: 88.66 }, {
  total: 3,
  warning: 2,
  info: 1,
  label: "2 项需优先处理，1 项提醒",
});
assert.deepEqual(riskyMapping.quantity_health_readiness, {
  total: 3,
  warning: 2,
  info: 1,
  label: "2 项需优先处理，1 项提醒",
});

const exportRiskMapping = buildQuoteMapping(
  [{ ...rows[0], spaceName: "厨房" }, { ...rows[0], spaceName: "主卧", spaceType: "卧室", curtainWallWidthSource: "fallback_longest_wall" }],
  [{ item_name: "按建筑面积计价项目", metric: "building_area_m2", unit: "m2", unit_price: 10 }, ...defaultQuoteRules()],
  { building_area_m2: 0 },
  { total: 2, warning: 1, info: 1, label: "1 项需优先处理，1 项提醒" },
);
assert.deepEqual(exportQuoteMappingConfirmationMessages(exportRiskMapping), [
  "仍有 1 项 warning 健康检查未处理。",
  "按建筑面积计价项目、强电布线、弱电布线、水路布管、材料搬运费、垃圾清运费、地面砖现场维护费 需要 QUOTE_EXT_WALL 建筑面积，当前为 0。",
]);
assert.deepEqual(exportQuoteMappingConfirmationMessages(buildQuoteMapping([{ ...rows[0], ceilingFinishType: "gypsum", curtainWallWidthSource: "not_applicable" }], updateQuoteRuleUnitPrice(defaultQuoteRules(), 3, 120), { building_area_m2: 88.66 })), []);

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
assert.equal(rules.length, 35);
assert.equal(rules[0].item_name, "墙面界面剂处理");
assert.equal(rules[0].metric, "latex_paint_area_m2");
assert.equal(rules[0].unit_price, 7);
assert.deepEqual(
  (({ material_price, auxiliary_price, labor_price }) => ({ material_price, auxiliary_price, labor_price }))(rules[0]),
  { material_price: 0, auxiliary_price: 4, labor_price: 3 },
);
assert.equal(rules.find((rule) => rule.item_name === "墙面贴瓷砖(600X1200)")?.space_types, undefined);
assert.deepEqual(rules.at(-1), {
  item_name: "暗窗帘箱",
  metric: "curtain_wall_width_m",
  unit: "M",
  unit_price: 110,
  material_price: 65,
  auxiliary_price: 0,
  labor_price: 45,
  space_types: ["客厅", "餐厅", "卧室", "书房"],
});
assert.deepEqual(rules.find((rule) => rule.item_name === "砌120厚砖墙"), {
  item_name: "砌120厚砖墙",
  metric: "new_wall_area_m2",
  unit: "M2",
  unit_price: 170,
  material_price: 80,
  auxiliary_price: 0,
  labor_price: 90,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "拆改及拆墙"), {
  item_name: "拆改及拆墙",
  metric: "demolition_wall_area_m2",
  unit: "M2",
  unit_price: 60,
  material_price: 0,
  auxiliary_price: 0,
  labor_price: 60,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "室内门"), {
  item_name: "室内门",
  metric: "interior_door_count",
  unit: "樘",
  unit_price: 1200,
  material_price: 1200,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.equal(rules.find((rule) => rule.item_name === "橱柜地柜"), undefined);
assert.equal(rules.find((rule) => rule.item_name === "橱柜吊柜"), undefined);
assert.deepEqual(rules.find((rule) => rule.item_name === "橱柜"), {
  item_name: "橱柜",
  metric: "kitchen_cabinet_length_m",
  unit: "M",
  unit_price: 600,
  material_price: 600,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: ["厨房"],
});
assert.deepEqual(rules.find((rule) => rule.item_name === "马桶"), {
  item_name: "马桶",
  metric: "toilet_count",
  unit: "套",
  unit_price: 1500,
  material_price: 1500,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: ["卫生间"],
});
assert.deepEqual(rules.find((rule) => rule.item_name === "地面瓷砖"), {
  item_name: "地面瓷砖",
  metric: "floor_tile_piece_count",
  unit: "片",
  unit_price: 50,
  material_price: 50,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "强电布线"), {
  item_name: "强电布线",
  metric: "building_area_m2",
  unit: "M2",
  unit_price: 78,
  material_price: 40,
  auxiliary_price: 0,
  labor_price: 38,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "水路布管"), {
  item_name: "水路布管",
  metric: "building_area_m2",
  unit: "M2",
  unit_price: 29.5,
  material_price: 17.5,
  auxiliary_price: 0,
  labor_price: 12,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "弱电布线"), {
  item_name: "弱电布线",
  metric: "building_area_m2",
  unit: "M2",
  unit_price: 25,
  material_price: 15,
  auxiliary_price: 0,
  labor_price: 10,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "全屋灯饰"), {
  item_name: "全屋灯饰",
  metric: "lighting_package_count",
  unit: "套",
  unit_price: 15000,
  material_price: 15000,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "全屋保洁"), {
  item_name: "全屋保洁",
  metric: "cleaning_package_count",
  unit: "套",
  unit_price: 4500,
  material_price: 4500,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "材料搬运费"), {
  item_name: "材料搬运费",
  metric: "building_area_m2",
  unit: "M2",
  unit_price: 8,
  material_price: 0,
  auxiliary_price: 0,
  labor_price: 8,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "垃圾清运费"), {
  item_name: "垃圾清运费",
  metric: "building_area_m2",
  unit: "M2",
  unit_price: 10,
  material_price: 0,
  auxiliary_price: 0,
  labor_price: 10,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "地面砖现场维护费"), {
  item_name: "地面砖现场维护费",
  metric: "building_area_m2",
  unit: "M2",
  unit_price: 8,
  material_price: 0,
  auxiliary_price: 3,
  labor_price: 5,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "全屋插座开关"), {
  item_name: "全屋插座开关",
  metric: "switch_socket_package_count",
  unit: "套",
  unit_price: 6000,
  material_price: 6000,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "美缝"), {
  item_name: "美缝",
  metric: "tile_area_m2",
  unit: "M2",
  unit_price: 12,
  material_price: 0,
  auxiliary_price: 12,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "瓷砖加工费"), {
  item_name: "瓷砖加工费",
  metric: "tile_area_m2",
  unit: "M2",
  unit_price: 20,
  material_price: 20,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "全屋定制"), {
  item_name: "全屋定制",
  metric: "custom_cabinet_area_m2",
  unit: "M2",
  unit_price: 600,
  material_price: 600,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "浴室柜"), {
  item_name: "浴室柜",
  metric: "bathroom_vanity_count",
  unit: "套",
  unit_price: 1500,
  material_price: 1500,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: ["卫生间"],
});
assert.deepEqual(rules[0].space_types, ["客厅", "餐厅", "卧室", "书房", "过道", "门厅", "楼梯过道", "衣帽间", "储物间", "露台"]);
rules[0].unit_price = 99;
rules[0].space_types?.push("厨房");
assert.equal(defaultQuoteRules()[0].unit_price, 7);
assert.deepEqual(defaultQuoteRules()[0].space_types, ["客厅", "餐厅", "卧室", "书房", "过道", "门厅", "楼梯过道", "衣帽间", "储物间", "露台"]);

const editedRules = updateQuoteRuleUnitPrice(defaultQuoteRules(), 3, 128.456);
assert.equal(editedRules[3].item_name, "厨房卫生间集成吊顶");
assert.equal(editedRules[3].unit_price, 128.46);
assert.equal(defaultQuoteRules()[3].unit_price, 260);
assert.notEqual(editedRules[3], defaultQuoteRules()[3]);
assert.equal(editedRules[2].unit_price, defaultQuoteRules()[2].unit_price);
assert.throws(() => updateQuoteRuleUnitPrice(defaultQuoteRules(), 3, -1), /报价规则 unit_price 无效/);
assert.throws(() => updateQuoteRuleUnitPrice(defaultQuoteRules(), 999, 1), /报价规则不存在/);

const apartmentRules = parseQuoteRules(readFileSync(new URL("../../../quote-rules-apartment-current.json", import.meta.url), "utf8"));
assert.deepEqual(apartmentRules, defaultQuoteRules());

const pendingMetricGroups = new Set(apartmentPendingQuoteMetrics().map((item) => item.source_group));
assert.equal(apartmentPendingQuoteMetrics().length, 0);
assert.ok(!pendingMetricGroups.has("防水"));
assert.ok(!pendingMetricGroups.has("窗台石"));
assert.ok(!pendingMetricGroups.has("窗帘箱"));
assert.ok(!pendingMetricGroups.has("墙砖"));
assert.ok(!pendingMetricGroups.has("定制"));
assert.ok(!pendingMetricGroups.has("水电"));
assert.ok(!pendingMetricGroups.has("主材"));
assert.ok(!pendingMetricGroups.has("套装项"));
assert.ok(!pendingMetricGroups.has("洁具"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "砌120厚砖墙"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "拆改及拆墙"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "室内门"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "橱柜"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "马桶"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "浴室柜"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "地面瓷砖"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "强电布线"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "水路布管"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "全屋灯饰"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "全屋定制"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name.includes("阳台") && item.suggested_metric === "wall_tile_marked_area_m2"));
assert.ok(!apartmentPendingQuoteMetrics().some((item) => item.item_name === "暗窗帘箱"));

const parsedRules = parseQuoteRules(JSON.stringify([{ item_name: "地面找平", metric: "floor_area_m2", unit: "m2", unit_price: 18, space_types: ["厨房", "卫生间"] }]));
assert.equal(parsedRules[0].item_name, "地面找平");
assert.equal(parsedRules[0].unit_price, 18);
assert.deepEqual(parsedRules[0].space_types, ["厨房", "卫生间"]);
assert.equal(parseQuoteRules(JSON.stringify([{ item_name: "管理费", metric: "building_area_m2", unit: "m2", unit_price: 10 }]))[0].metric, "building_area_m2");

const parsedWetRules = parseQuoteRules(JSON.stringify([
  { item_name: "墙面贴瓷砖(600X1200)", metric: "wall_tile_area_m2", unit: "m2", unit_price: 100, space_types: ["厨房", "卫生间"] },
  { item_name: "墙地面防漏处理", metric: "waterproof_area_m2", unit: "m2", unit_price: 51.5, space_types: ["厨房", "卫生间", "阳台"] },
  { item_name: "窗台石铺贴", metric: "windowsill_length_m", unit: "M", unit_price: 73 },
  { item_name: "暗窗帘箱", metric: "curtain_wall_width_m", unit: "M", unit_price: 110, space_types: ["卧室"] },
  { item_name: "橱柜", metric: "kitchen_cabinet_length_m", unit: "M", unit_price: 600, space_types: ["厨房"] },
  { item_name: "马桶", metric: "toilet_count", unit: "套", unit_price: 1500, space_types: ["卫生间"] },
  { item_name: "浴室柜", metric: "bathroom_vanity_count", unit: "套", unit_price: 1500, space_types: ["卫生间"] },
  { item_name: "地面瓷砖", metric: "floor_tile_piece_count", unit: "片", unit_price: 50 },
  { item_name: "强电布线", metric: "electrical_scope_area_m2", unit: "M2", unit_price: 78 },
  { item_name: "水路布管", metric: "plumbing_scope_area_m2", unit: "M2", unit_price: 29.5 },
  { item_name: "全屋灯饰", metric: "lighting_package_count", unit: "套", unit_price: 15000 },
  { item_name: "全屋定制", metric: "custom_cabinet_area_m2", unit: "M2", unit_price: 600 },
]));
assert.equal(parsedWetRules[0].metric, "wall_tile_area_m2");
assert.equal(parsedWetRules[1].metric, "waterproof_area_m2");
assert.equal(parsedWetRules[2].metric, "windowsill_length_m");
assert.equal(parsedWetRules[3].metric, "curtain_wall_width_m");
assert.equal(parsedWetRules[4].metric, "kitchen_cabinet_length_m");
assert.equal(parsedWetRules[5].metric, "toilet_count");
assert.equal(parsedWetRules[6].metric, "bathroom_vanity_count");
assert.equal(parsedWetRules[7].metric, "floor_tile_piece_count");
assert.equal(parsedWetRules[8].metric, "electrical_scope_area_m2");
assert.equal(parsedWetRules[9].metric, "plumbing_scope_area_m2");
assert.equal(parsedWetRules[10].metric, "lighting_package_count");
assert.equal(parsedWetRules[11].metric, "custom_cabinet_area_m2");
assert.equal(parseQuoteRules(JSON.stringify([{ item_name: "美缝", metric: "tile_area_m2", unit: "M2", unit_price: 12 }]))[0].metric, "tile_area_m2");
assert.equal(parseQuoteRules(JSON.stringify([{ item_name: "全屋插座开关", metric: "switch_socket_package_count", unit: "套", unit_price: 6000 }]))[0].metric, "switch_socket_package_count");
assert.equal(parseQuoteRules(JSON.stringify([{ item_name: "全屋保洁", metric: "cleaning_package_count", unit: "套", unit_price: 4500 }]))[0].metric, "cleaning_package_count");

const balconyMapping = buildQuoteMapping([{ ...rows[0], spaceName: "阳台", spaceType: "阳台", wallTileAreaM2: 0, waterproofAreaM2: 9 }], undefined, { building_area_m2: 88.66 });
assert.deepEqual(balconyMapping.items.map((item) => item.item_name), [
  "地面找平",
  "地面砖铺贴(750X1500)",
  "墙地面防漏处理",
  "地面瓷砖",
  "瓷砖加工费",
  "美缝",
  "强电布线",
  "弱电布线",
  "水路布管",
  "材料搬运费",
  "垃圾清运费",
  "地面砖现场维护费",
  "全屋插座开关",
  "全屋灯饰",
  "全屋保洁",
]);
assert.deepEqual(balconyMapping.items.filter((item) => ["地面瓷砖", "瓷砖加工费", "美缝", "强电布线", "水路布管"].includes(item.item_name)).map((item) => item.space_name), ["全屋", "全屋", "全屋", "全屋", "全屋"]);

const tiledBalconyMapping = buildQuoteMapping([{ ...rows[0], spaceName: "阳台", spaceType: "阳台", wallTileAreaM2: 14, waterproofAreaM2: 9 }], undefined, { building_area_m2: 88.66 });
assert.deepEqual(tiledBalconyMapping.items.map((item) => item.item_name), [
  "地面找平",
  "地面砖铺贴(750X1500)",
  "墙面贴瓷砖(600X1200)",
  "墙地面防漏处理",
  "地面瓷砖",
  "瓷砖加工费",
  "美缝",
  "强电布线",
  "弱电布线",
  "水路布管",
  "材料搬运费",
  "垃圾清运费",
  "地面砖现场维护费",
  "全屋插座开关",
  "全屋灯饰",
  "全屋保洁",
]);

const newWallMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", wallTileAreaM2: 0, waterproofAreaM2: 0, newWallAreaM2: 11.2 }]);
assert.deepEqual(newWallMapping.items.filter((item) => item.item_name === "砌120厚砖墙"), [
  {
    floor: "全屋",
    space_name: "全屋",
    space_type: "全屋",
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
    floor: "全屋",
    space_name: "全屋",
    space_type: "全屋",
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

const bathroomDoorMapping = buildQuoteMapping([
  { ...rows[0], spaceName: "公卫", spaceType: "卫生间", wallTileAreaM2: 20.7, waterproofAreaM2: 21.84, bathroomDoorCount: 1 },
]);
assert.deepEqual(bathroomDoorMapping.items.filter((item) => item.item_name === "卫生间门"), [
  {
    floor: "一层",
    space_name: "公卫",
    space_type: "卫生间",
    item_name: "卫生间门",
    quantity: 1,
    unit: "樘",
    unit_price: 1200,
    amount: 1200,
  },
]);

const kitchenSlidingDoorMapping = buildQuoteMapping([
  { ...rows[0], spaceName: "厨房", spaceType: "厨房", slidingDoorAreaM2: 3.68, slidingDoorCasingLengthM: 5.95 },
]);
assert.deepEqual(kitchenSlidingDoorMapping.items.filter((item) => item.item_name === "厨房推拉门" || item.item_name === "厨房推拉门双包套"), [
  {
    floor: "一层",
    space_name: "厨房",
    space_type: "厨房",
    item_name: "厨房推拉门",
    quantity: 3.68,
    unit: "m2",
    unit_price: 550,
    amount: 2024,
  },
  {
    floor: "一层",
    space_name: "厨房",
    space_type: "厨房",
    item_name: "厨房推拉门双包套",
    quantity: 5.95,
    unit: "M",
    unit_price: 300,
    amount: 1785,
  },
]);

const kitchenCabinetMapping = buildQuoteMapping([{ ...rows[0], spaceName: "厨房", spaceType: "厨房", kitchenBaseCabinetLengthM: 4.3, kitchenWallCabinetLengthM: 3.0 }]);
assert.deepEqual(kitchenCabinetMapping.items.filter((item) => item.item_name === "橱柜"), [
  {
    floor: "全屋",
    space_name: "全屋",
    space_type: "全屋",
    item_name: "橱柜",
    quantity: 7.3,
    unit: "M",
    unit_price: 600,
    amount: 4380,
  },
]);

const customCabinetMapping = buildQuoteMapping([{ ...rows[0], spaceName: "主卧", spaceType: "卧室", wallTileAreaM2: 0, waterproofAreaM2: 0, customCabinetAreaM2: 9.8 }]);
assert.deepEqual(customCabinetMapping.items.filter((item) => item.item_name === "全屋定制"), [
  {
    floor: "一层",
    space_name: "主卧",
    space_type: "卧室",
    item_name: "全屋定制",
    quantity: 9.8,
    unit: "M2",
    unit_price: 600,
    amount: 5880,
  },
]);

const bathroomFixtureMapping = buildQuoteMapping([{ ...rows[0], spaceName: "卫生间", spaceType: "卫生间", wallTileAreaM2: 20.7, waterproofAreaM2: 21.84, toiletCount: 1, bathroomVanityCount: 1 }]);
assert.deepEqual(bathroomFixtureMapping.items.filter((item) => item.item_name === "马桶" || item.item_name === "浴室柜"), [
  {
    floor: "一层",
    space_name: "卫生间",
    space_type: "卫生间",
    item_name: "马桶",
    quantity: 1,
    unit: "套",
    unit_price: 1500,
    amount: 1500,
  },
  {
    floor: "一层",
    space_name: "卫生间",
    space_type: "卫生间",
    item_name: "浴室柜",
    quantity: 1,
    unit: "套",
    unit_price: 1500,
    amount: 1500,
  },
]);

const windowedBedroomMapping = buildQuoteMapping([{ ...rows[0], spaceName: "主卧", spaceType: "卧室", windowWidthTotalM: 1.8, windowsillLengthM: 1.8, wallTileAreaM2: 0, waterproofAreaM2: 0 }]);
const windowsillItem = windowedBedroomMapping.items.find((item) => item.item_name === "窗台石铺贴");
assert.equal(windowsillItem?.quantity, 1.8);
assert.equal(windowsillItem?.amount, 131.4);

const curtainReadiness = curtainQuoteReadiness([
  curtainOnlyRow("主卧", "卧室", 4.2, "manual"),
  curtainOnlyRow("次卧", "卧室", 3.6, "matched_window_wall"),
  curtainOnlyRow("餐厅", "餐厅", 4.8, "matched_l_shape_window"),
  curtainOnlyRow("书房", "书房", 3.2, "fallback_longest_wall"),
  curtainOnlyRow("客厅", "客厅", 0, "manual_required_l_shape_window"),
  { ...rows[1], spaceName: "电梯井", curtainWallWidthM: 5, curtainWallWidthSource: "manual" },
]);

assert.deepEqual(curtainReadiness, {
  ready_count: 4,
  pending_count: 0,
  ready_space_names: ["主卧", "次卧", "餐厅", "书房"],
  pending_space_names: [],
});
assert.equal(formatCurtainReadinessSpaces(["主卧", "次卧"]), "主卧、次卧");
assert.equal(formatCurtainReadinessSpaces(["主卧", "次卧", "书房", "客厅", "南卧"]), "主卧、次卧、书房、客厅等 5 个");
assert.equal(formatCurtainReadinessSpaces([]), "暂无");

const curtainCandidateMapping = buildQuoteMapping([
  curtainOnlyRow("主卧", "卧室", 4.2, "manual"),
  curtainOnlyRow("次卧", "卧室", 3.6, "matched_window_wall"),
  curtainOnlyRow("餐厅", "餐厅", 4.8, "matched_l_shape_window"),
  curtainOnlyRow("书房", "书房", 3.2, "fallback_longest_wall"),
  curtainOnlyRow("客厅", "客厅", 0, "manual_required_l_shape_window"),
], undefined, { building_area_m2: 88.66 });
assert.deepEqual(curtainCandidateMapping.curtain_quote_readiness, {
  ready_count: 4,
  pending_count: 0,
  ready_space_names: ["主卧", "次卧", "餐厅", "书房"],
  pending_space_names: [],
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
    note: "已进入金额汇总",
  },
  {
    floor: "一层",
    space_name: "次卧",
    space_type: "卧室",
    item_name: "暗窗帘箱",
    quantity: 3.6,
    unit: "M",
    unit_price: 110,
    source: "matched_window_wall",
    note: "已进入金额汇总",
  },
  {
    floor: "一层",
    space_name: "餐厅",
    space_type: "餐厅",
    item_name: "暗窗帘箱",
    quantity: 4.8,
    unit: "M",
    unit_price: 110,
    source: "matched_l_shape_window",
    note: "已进入金额汇总",
  },
  {
    floor: "一层",
    space_name: "书房",
    space_type: "书房",
    item_name: "暗窗帘箱",
    quantity: 3.2,
    unit: "M",
    unit_price: 110,
    source: "fallback_longest_wall",
    note: "已进入金额汇总",
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
  {
    floor: "一层",
    space_name: "次卧",
    space_type: "卧室",
    item_name: "暗窗帘箱",
    quantity: 3.6,
    unit: "M",
    unit_price: 110,
    amount: 396,
  },
  {
    floor: "一层",
    space_name: "餐厅",
    space_type: "餐厅",
    item_name: "暗窗帘箱",
    quantity: 4.8,
    unit: "M",
    unit_price: 110,
    amount: 528,
  },
  {
    floor: "一层",
    space_name: "书房",
    space_type: "书房",
    item_name: "暗窗帘箱",
    quantity: 3.2,
    unit: "M",
    unit_price: 110,
    amount: 352,
  },
]);
assert.equal(curtainCandidateMapping.summary.total_amount, 41290.61);

assert.throws(() => parseQuoteRules("{bad json"), /报价规则 JSON 格式无效/);
assert.throws(() => parseQuoteRules(JSON.stringify({ item_name: "x" })), /报价规则必须是数组/);
assert.throws(() => parseQuoteRules(JSON.stringify([{ item_name: "x", metric: "bad", unit: "m2", unit_price: 1 }])), /报价规则 metric 无效/);
assert.throws(() => parseQuoteRules(JSON.stringify([{ item_name: "x", metric: "floor_area_m2", unit: "m2", unit_price: -1 }])), /报价规则 unit_price 无效/);
assert.throws(() => parseQuoteRules(JSON.stringify([{ item_name: "x", metric: "floor_area_m2", unit: "m2", unit_price: 1, space_types: [""] }])), /报价规则 space_types 无效/);

assert.equal(quoteMappingFileName("test-case.dxf"), "test-case.quote-mapping.json");
assert.equal(quoteMappingFileName("样例数据"), "quote-mapping.json");
assert.equal(quoteRulesTemplateFileName("test-case.dxf"), "test-case.quote-rules.json");
assert.equal(quoteRulesTemplateFileName("样例数据"), "quote-rules.json");
