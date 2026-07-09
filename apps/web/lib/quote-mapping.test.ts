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
  updateQuoteRulePricePart,
  updateQuoteRuleUnitPrice,
  withDefaultQuoteRuleCoverage,
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
const hydropowerSummary = {
  switchPointCount: 4,
  standardOutletCount: 20,
  sofaChargingOutletCount: 2,
  heatingOutletCount: 1,
  bedEndFanOutletCount: 3,
  kitchenCounterOutletCount: 6,
  lightPointCount: 8,
  weakPointCount: 6,
  acCircuitCount: 4,
  highPowerCircuitCount: 2,
  bathroomHeaterCircuitCount: 2,
  smartToiletOutletCount: 2,
  washingMachineOutletCount: 1,
  dryerOutletCount: 1,
  waterPurifierOutletCount: 1,
  coldWaterPointCount: 8,
  hotWaterPointCount: 5,
  drainPointCount: 5,
  floorDrainPointCount: 3,
  strongConduitLengthM: 86.5,
  weakConduitLengthM: 22.4,
  waterPipeLengthM: 31.6,
  drainPipeLengthM: 17.2,
  lowConfidencePointCount: 0,
};

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
assert.equal(mapping.items.length, 20);
assert.equal(mapping.items[0].space_name, "厨房");
assert.equal(mapping.items[0].space_type, "厨房");
assert.deepEqual(mapping.items.map((item) => item.item_name), [
  "厨房卫生间集成吊顶",
  "地面找平",
  "地面砖铺贴(750X1500)",
  "墙面贴瓷砖(600X1200)",
  "墙地面防漏处理",
  "地面瓷砖",
  "墙面瓷砖",
  "瓷砖加工费",
  "美缝",
  "材料搬运费",
  "垃圾清运费",
  "墙地面砖现场保护",
  "水泥墙开槽",
  "打混凝土过梁孔",
  "厨房、卫生间排污管包隔音棉",
  "补线、管槽及零星修补",
  "橱柜",
  "全屋插座开关",
  "全屋灯饰",
  "全屋保洁",
]);
assert.equal(mapping.items[0].quantity, 4.48);
assert.equal(mapping.items[0].unit_price, 120);
assert.equal(mapping.items[0].amount, 537.6);
assert.equal(mapping.items[1].quantity, 4.48);
assert.equal(mapping.items[1].unit_price, 55);
assert.equal(mapping.items[1].amount, 246.4);
assert.equal(mapping.items[3].quantity, 20.7);
assert.equal(mapping.items[3].amount, 2028.6);
assert.equal(mapping.items[4].quantity, 7.22);
assert.equal(mapping.items[4].amount, 433.2);
assert.deepEqual(mapping.items.slice(5, 20).map((item) => item.space_name), [
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
  "全屋",
  "全屋",
]);
assert.equal(mapping.items[5].quantity, 5);
assert.equal(mapping.items[5].amount, 400);
assert.equal(mapping.items[6].quantity, 31);
assert.equal(mapping.items[6].amount, 1705);
assert.equal(mapping.items[7].quantity, 25.18);
assert.equal(mapping.items[7].amount, 151.08);
assert.equal(mapping.items[8].quantity, 25.18);
assert.equal(mapping.items[8].amount, 251.8);
assert.equal(mapping.items[9].quantity, 88.66);
assert.equal(mapping.items[9].amount, 1329.9);
assert.equal(mapping.items[10].quantity, 88.66);
assert.equal(mapping.items[10].amount, 1063.92);
assert.equal(mapping.items[11].quantity, 88.66);
assert.equal(mapping.items[11].amount, 1861.86);
assert.equal(mapping.items[12].quantity, 88.66);
assert.equal(mapping.items[12].amount, 1063.92);
assert.equal(mapping.items[13].quantity, 8.87);
assert.equal(mapping.items[13].amount, 310.45);
assert.equal(mapping.items[14].quantity, 4.2);
assert.equal(mapping.items[14].amount, 210);
assert.equal(mapping.items[15].quantity, 88.66);
assert.equal(mapping.items[15].amount, 487.63);

const hydropowerMapping = buildQuoteMapping(rows, defaultQuoteRules(), { building_area_m2: 88.66 }, {
  hydropowerSummary,
});
assert.ok(hydropowerMapping.items.some((item) => item.item_name === "强电插座" && item.quantity === 37 && item.unit_price === 72));
assert.ok(hydropowerMapping.items.some((item) => item.item_name === "设备专线" && item.quantity === 8 && item.unit_price === 180));
assert.ok(hydropowerMapping.items.some((item) => item.item_name === "排水点" && item.quantity === 8 && item.unit_price === 200));
assert.ok(hydropowerMapping.items.some((item) => item.item_name === "强电线管" && item.quantity === 86.5 && item.unit_price === 38));
assert.equal(hydropowerMapping.items.some((item) => item.item_name === "普通插座点位"), false);
assert.equal(hydropowerMapping.items.some((item) => item.item_name === "空调专线"), false);
assert.equal(hydropowerMapping.items.some((item) => item.item_name === "冷水点位"), false);
assert.equal(hydropowerMapping.items.some((item) => item.item_name === "强电布线"), false);
assert.equal(hydropowerMapping.items.some((item) => item.item_name === "水路布管"), false);
assert.deepEqual(hydropowerMapping.legacy_hydropower_area_rule_item_names, []);

const legacyHydropowerRules = parseQuoteRules(
  JSON.stringify([
    { item_name: "强电布线", metric: "electrical_scope_area_m2", unit: "m2", unit_price: 80 },
    { item_name: "水路布管", metric: "plumbing_scope_area_m2", unit: "m2", unit_price: 70 },
  ]),
);
const legacyHydropowerMapping = buildQuoteMapping(rows, legacyHydropowerRules, { building_area_m2: 88.66 }, {
  hydropowerSummary,
});
assert.deepEqual(legacyHydropowerMapping.legacy_hydropower_area_rule_item_names, ["强电布线", "水路布管"]);

const duplicateSpaceNameMapping = buildQuoteMapping(
  [
    {
      ...rows[0],
      spaceName: "卧室",
      spaceType: "卧室",
      ceilingFinishType: undefined,
      floorAreaM2: 12,
      ceilingAreaM2: 12,
      latexPaintAreaM2: 20,
      wallTileAreaM2: 0,
      waterproofAreaM2: 0,
      curtainWallWidthSource: "not_applicable",
      customCabinetAreaM2: 0,
      kitchenBaseCabinetLengthM: 0,
      kitchenWallCabinetLengthM: 0,
    },
    {
      ...rows[0],
      spaceName: "卧室",
      spaceType: "卧室",
      ceilingFinishType: undefined,
      floorAreaM2: 10,
      ceilingAreaM2: 10,
      latexPaintAreaM2: 18,
      wallTileAreaM2: 0,
      waterproofAreaM2: 0,
      curtainWallWidthSource: "not_applicable",
      customCabinetAreaM2: 0,
      kitchenBaseCabinetLengthM: 0,
      kitchenWallCabinetLengthM: 0,
    },
  ],
  undefined,
  { building_area_m2: 88.66 },
);
assert.ok(duplicateSpaceNameMapping.items.some((item) => item.space_name === "卧室一" && item.item_name === "墙面乳胶漆" && item.quantity === 20));
assert.ok(duplicateSpaceNameMapping.items.some((item) => item.space_name === "卧室二" && item.item_name === "墙面乳胶漆" && item.quantity === 18));
assert.ok(!duplicateSpaceNameMapping.items.some((item) => item.space_name === "卧室" && item.item_name === "墙面乳胶漆"));
assert.equal(mapping.items[16].quantity, 7.3);
assert.equal(mapping.items[16].amount, 5102.7);
assert.deepEqual(mapping.items[17], {
  floor: "全屋",
  space_name: "全屋",
  space_type: "全屋",
  item_name: "全屋插座开关",
  quantity: 1,
  unit: "套",
  unit_price: 20,
  material_price: 20,
  auxiliary_price: 0,
  labor_price: 0,
  amount: 1420,
});
assert.deepEqual(mapping.items[18], {
  floor: "全屋",
  space_name: "全屋",
  space_type: "全屋",
  item_name: "全屋灯饰",
  quantity: 1,
  unit: "套",
  unit_price: 0,
  material_price: 0,
  auxiliary_price: 0,
  labor_price: 0,
  amount: 0,
});
assert.deepEqual(mapping.items[19], {
  floor: "全屋",
  space_name: "全屋",
  space_type: "全屋",
  item_name: "全屋保洁",
  quantity: 1,
  unit: "套",
  unit_price: 0,
  material_price: 0,
  auxiliary_price: 0,
  labor_price: 0,
  amount: 0,
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
  mapping.items[18],
  mapping.items[19],
]);
assert.equal(mapping.summary.item_count, 20);
assert.equal(mapping.summary.space_count, 1);
assert.equal(mapping.summary.total_amount, 19043.1);

const excludedOnlyMapping = buildQuoteMapping([rows[1]]);

assert.equal(excludedOnlyMapping.items.length, 0);
assert.equal(excludedOnlyMapping.summary.total_amount, 0);

const bedroomDefaultMapping = buildQuoteMapping([{ ...rows[0], spaceName: "主卧", spaceType: "卧室", latexPaintAreaM2: 25.54, wallTileAreaM2: 0, waterproofAreaM2: 0, customCabinetAreaM2: 9.8, kitchenBaseCabinetLengthM: 0, kitchenWallCabinetLengthM: 0 }], undefined, { building_area_m2: 88.66 });

assert.ok(bedroomDefaultMapping.items.some((item) => item.item_name === "全屋定制" && item.space_name === "主卧"));
assert.ok(!bedroomDefaultMapping.items.some((item) => item.item_name === "强电布线"));
assert.ok(!bedroomDefaultMapping.items.some((item) => item.item_name === "水路布管"));
assert.deepEqual(bedroomDefaultMapping.items.filter((item) => ["地面瓷砖", "瓷砖加工费", "美缝"].includes(item.item_name)).map((item) => item.space_name), ["全屋", "全屋", "全屋"]);
assert.ok(bedroomDefaultMapping.summary.total_amount > 0);

const villaDrySpaceMapping = buildQuoteMapping(
  [
    {
      ...rows[0],
      spaceName: "茶室",
      spaceType: "茶室",
      floorAreaM2: 9,
      ceilingAreaM2: 9,
      wallMeasureLengthM: 10,
      latexPaintAreaM2: 28,
      wallTileAreaM2: 0,
      waterproofAreaM2: 0,
      curtainWallWidthM: 3,
      curtainWallWidthSource: "matched_window_wall",
      interiorDoorCount: 1,
      customCabinetAreaM2: 0,
      kitchenBaseCabinetLengthM: 0,
      kitchenWallCabinetLengthM: 0,
    },
    {
      ...rows[0],
      spaceName: "麻将房",
      spaceType: "娱乐室",
      floorAreaM2: 8,
      ceilingAreaM2: 8,
      wallMeasureLengthM: 9,
      latexPaintAreaM2: 25,
      wallTileAreaM2: 0,
      waterproofAreaM2: 0,
      curtainWallWidthM: 2.5,
      curtainWallWidthSource: "matched_window_wall",
      interiorDoorCount: 1,
      customCabinetAreaM2: 0,
      kitchenBaseCabinetLengthM: 0,
      kitchenWallCabinetLengthM: 0,
    },
  ],
  defaultQuoteRules(),
  { building_area_m2: 0 },
);

assert.ok(villaDrySpaceMapping.items.some((item) => item.space_name === "茶室" && item.item_name === "墙面乳胶漆"));
assert.ok(villaDrySpaceMapping.items.some((item) => item.space_name === "麻将房" && item.item_name === "顶面乳胶漆"));
assert.equal(villaDrySpaceMapping.curtain_quote_readiness.ready_count, 2);
assert.equal(villaDrySpaceMapping.items.filter((item) => item.item_name === "暗窗帘箱").length, 2);

const villaSpecialSpaceMapping = buildQuoteMapping(
  [
    {
      ...rows[0],
      spaceName: "一层-楼梯间",
      spaceType: "楼梯",
      floorAreaM2: 12,
      ceilingAreaM2: 0,
      wallTileAreaM2: 0,
      waterproofAreaM2: 0,
      stairRailingLengthM: 4.1,
      guardrailLengthM: 0,
      curtainWallWidthM: 0,
      curtainWallWidthSource: "not_applicable",
    },
    {
      ...rows[0],
      spaceName: "一层-露台",
      spaceType: "露台",
      floorAreaM2: 8,
      ceilingAreaM2: 8,
      wallTileAreaM2: 0,
      waterproofAreaM2: 10,
      stairRailingLengthM: 0,
      guardrailLengthM: 6,
      curtainWallWidthM: 0,
      curtainWallWidthSource: "not_applicable",
    },
    {
      ...rows[0],
      spaceName: "一层-挑空",
      spaceType: "挑空",
      floorAreaM2: 20,
      ceilingAreaM2: 0,
      latexPaintAreaM2: 35,
      wallTileAreaM2: 0,
      waterproofAreaM2: 0,
      curtainWallWidthM: 0,
      curtainWallWidthSource: "not_applicable",
      atriumCurtainWidthM: 5,
      atriumCurtainHeightM: 5.6,
      atriumCurtainAreaM2: 28,
    },
  ],
  defaultQuoteRules(),
  { building_area_m2: 0 },
);

assert.ok(villaSpecialSpaceMapping.items.some((item) => item.space_name === "一层-楼梯间" && item.item_name === "楼梯扶手" && item.quantity === 4.1));
assert.ok(villaSpecialSpaceMapping.items.some((item) => item.space_name === "一层-露台" && item.item_name === "栏杆/护栏" && item.quantity === 6));
assert.ok(villaSpecialSpaceMapping.items.some((item) => item.space_name === "一层-挑空" && item.item_name === "墙面乳胶漆" && item.quantity === 35));
assert.deepEqual(villaSpecialSpaceMapping.atrium_curtain_candidates, [
  {
    floor: "一层",
    space_name: "一层-挑空",
    space_type: "挑空",
    item_name: "挑空窗帘",
    width_m: 5,
    height_m: 5.6,
    area_m2: 28,
    note: "挑空窗帘为非常规尺寸，宽度按窗户所在墙面候选，帘高按关联楼层层高汇总，需设计师复核。",
  },
]);
assert.ok(!villaSpecialSpaceMapping.items.some((item) => item.space_name === "一层-挑空" && ["窗帘", "暗窗帘箱"].includes(item.item_name)));

const livingRoomWallTileMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", wallTileAreaM2: 11.2, waterproofAreaM2: 0, customCabinetAreaM2: 0, kitchenBaseCabinetLengthM: 0, kitchenWallCabinetLengthM: 0 }]);
assert.ok(livingRoomWallTileMapping.items.some((item) => item.space_name === "客厅" && item.item_name === "墙面贴瓷砖(600X1200)" && item.quantity === 11.2));

const kitchenDefaultMapping = buildQuoteMapping([rows[0]]);
assert.ok(kitchenDefaultMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "墙面贴瓷砖(600X1200)"));
assert.ok(kitchenDefaultMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "墙地面防漏处理"));
assert.ok(kitchenDefaultMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "厨房卫生间集成吊顶" && item.quantity === 4.48 && item.unit_price === 120));
assert.ok(!kitchenDefaultMapping.items.some((item) => item.space_name === "厨房" && ["墙面乳胶漆", "顶面批嵌", "顶面乳胶漆"].includes(item.item_name)));
assert.deepEqual(integratedCeilingPriceReminderItems(kitchenDefaultMapping), []);

const bathroomDefaultMapping = buildQuoteMapping([{ ...rows[0], spaceName: "卫生间", spaceType: "卫生间", toiletCount: 1, bathroomVanityCount: 1 }]);
assert.ok(bathroomDefaultMapping.items.some((item) => item.space_name === "卫生间" && item.item_name === "花洒" && item.quantity === 1 && item.unit_price === 900));
assert.ok(bathroomDefaultMapping.items.some((item) => item.space_name === "卫生间" && item.item_name === "卫浴五件套" && item.quantity === 1 && item.unit_price === 280));
assert.ok(!kitchenDefaultMapping.items.some((item) => item.item_name === "花洒" || item.item_name === "卫浴五件套"));

const kitchenGypsumCeilingMapping = buildQuoteMapping([{ ...rows[0], ceilingFinishType: "gypsum" }]);
assert.ok(!kitchenGypsumCeilingMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "厨房卫生间集成吊顶"));
assert.ok(kitchenGypsumCeilingMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "顶面批嵌" && item.quantity === 4.48));
assert.ok(kitchenGypsumCeilingMapping.items.some((item) => item.space_name === "厨房" && item.item_name === "顶面乳胶漆" && item.quantity === 4.48));
assert.deepEqual(integratedCeilingPriceReminderItems(kitchenGypsumCeilingMapping), []);

const gypsumLineCeilingMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", gypsumLineCeilingLengthM: 7.5 }]);
assert.ok(gypsumLineCeilingMapping.items.some((item) => item.space_name === "客厅" && item.item_name === "石膏线吊顶" && item.quantity === 7.5 && item.unit_price === 35));

const stairVoidCorridorMapping = buildQuoteMapping([
  {
    ...rows[0],
    floor: "负二层",
    spaceName: "过道/电梯井",
    spaceType: "过道",
    floorAreaM2: 16.04,
    ceilingAreaM2: 7.89,
    voidAreaM2: 8.15,
    heightM: 2.8,
    latexPaintAreaM2: 25,
    wallTileAreaM2: 0,
    waterproofAreaM2: 0,
  },
]);
assert.ok(stairVoidCorridorMapping.items.some((item) => item.space_name === "过道/电梯井" && item.item_name === "楼梯踏步铺贴" && item.quantity === 15));

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
  "按建筑面积计价项目、材料搬运费、垃圾清运费、墙地面砖现场保护、水泥墙开槽、补线、管槽及零星修补 需要 QUOTE_EXT_WALL 建筑面积，当前为 0。",
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
assert.equal(rules.length, 75);
assert.equal(rules[0].item_name, "墙面界面剂处理");
assert.equal(rules[0].metric, "latex_paint_area_m2");
assert.equal(rules[0].unit_price, 7);
assert.deepEqual(
  (({ material_price, auxiliary_price, labor_price }) => ({ material_price, auxiliary_price, labor_price }))(rules[0]),
  { material_price: 0, auxiliary_price: 4, labor_price: 3 },
);
assert.equal(rules.find((rule) => rule.item_name === "墙面贴瓷砖(600X1200)")?.space_types, undefined);
assert.deepEqual(rules.find((rule) => rule.item_name === "双眼皮/边吊吊顶"), {
  item_name: "双眼皮/边吊吊顶",
  metric: "edge_ceiling_length_m",
  unit: "M",
  unit_price: 80,
  material_price: 35,
  auxiliary_price: 15,
  labor_price: 30,
  space_types: ["客厅", "餐厅", "卧室", "书房", "茶室", "娱乐室", "过道", "门厅", "楼梯", "楼梯过道", "挑空", "衣帽间", "储物间", "厨房", "卫生间"],
});
assert.deepEqual(rules.find((rule) => rule.item_name === "石膏线吊顶"), {
  item_name: "石膏线吊顶",
  metric: "gypsum_line_ceiling_length_m",
  unit: "M",
  unit_price: 35,
  material_price: 12,
  auxiliary_price: 5,
  labor_price: 18,
  space_types: ["客厅", "餐厅", "卧室", "书房", "茶室", "娱乐室", "过道", "门厅", "楼梯", "楼梯过道", "挑空", "衣帽间", "储物间", "厨房", "卫生间"],
});
assert.deepEqual(rules.at(-1), {
  item_name: "暗窗帘箱",
  metric: "curtain_wall_width_m",
  unit: "M",
  unit_price: 90,
  material_price: 35,
  auxiliary_price: 10,
  labor_price: 45,
  space_types: ["客厅", "餐厅", "卧室", "书房", "茶室", "娱乐室"],
});
assert.deepEqual(rules.find((rule) => rule.item_name === "砌砖墙"), {
  item_name: "砌砖墙",
  metric: "new_wall_unclassified_area_m2",
  unit: "M2",
  unit_price: 150,
  material_price: 45,
  auxiliary_price: 25,
  labor_price: 80,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "砌120厚砖墙"), {
  item_name: "砌120厚砖墙",
  metric: "new_wall_120_area_m2",
  unit: "M2",
  unit_price: 150,
  material_price: 45,
  auxiliary_price: 25,
  labor_price: 80,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "砌240厚砖墙"), {
  item_name: "砌240厚砖墙",
  metric: "new_wall_240_area_m2",
  unit: "M2",
  unit_price: 230,
  material_price: 80,
  auxiliary_price: 30,
  labor_price: 120,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "楼梯扶手"), {
  item_name: "楼梯扶手",
  metric: "stair_railing_length_m",
  unit: "M",
  unit_price: 480,
  material_price: 480,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "栏杆/护栏"), {
  item_name: "栏杆/护栏",
  metric: "guardrail_length_m",
  unit: "M",
  unit_price: 450,
  material_price: 450,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "水泥墙开槽"), {
  item_name: "水泥墙开槽",
  metric: "building_area_m2",
  unit: "M2",
  unit_price: 12,
  material_price: 0,
  auxiliary_price: 4,
  labor_price: 8,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "打混凝土过梁孔"), {
  item_name: "打混凝土过梁孔",
  metric: "building_area_tenth_count",
  unit: "个",
  unit_price: 35,
  material_price: 0,
  auxiliary_price: 0,
  labor_price: 35,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "拆改及拆墙"), {
  item_name: "拆改及拆墙",
  metric: "demolition_wall_area_m2",
  unit: "M2",
  unit_price: 70,
  material_price: 0,
  auxiliary_price: 10,
  labor_price: 60,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "背景墙"), {
  item_name: "背景墙",
  metric: "background_wall_area_m2",
  unit: "M2",
  unit_price: 280,
  material_price: 280,
  auxiliary_price: 0,
  labor_price: 0,
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
  unit_price: 699,
  material_price: 699,
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
  unit_price: 80,
  material_price: 80,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "墙面瓷砖"), {
  item_name: "墙面瓷砖",
  metric: "wall_tile_piece_count",
  unit: "片",
  unit_price: 55,
  material_price: 55,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.equal(rules.find((rule) => rule.item_name === "普通插座点位"), undefined);
assert.equal(rules.find((rule) => rule.item_name === "沙发充电插座"), undefined);
assert.equal(rules.find((rule) => rule.item_name === "空调专线"), undefined);
assert.equal(rules.find((rule) => rule.item_name === "冷水点位"), undefined);
assert.equal(rules.find((rule) => rule.item_name === "地漏点位"), undefined);
assert.equal(rules.find((rule) => rule.item_name === "强电布线"), undefined);
assert.equal(rules.find((rule) => rule.item_name === "弱电布线"), undefined);
assert.equal(rules.find((rule) => rule.item_name === "水路布管"), undefined);
assert.deepEqual(rules.find((rule) => rule.item_name === "强电插座"), {
  item_name: "强电插座",
  metric: "hydropower_strong_outlet_count",
  unit: "位",
  unit_price: 72,
  material_price: 5,
  auxiliary_price: 12,
  labor_price: 55,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "开关"), {
  item_name: "开关",
  metric: "hydropower_switch_count",
  unit: "位",
  unit_price: 68,
  material_price: 5,
  auxiliary_price: 10,
  labor_price: 53,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "灯位"), {
  item_name: "灯位",
  metric: "hydropower_light_count",
  unit: "位",
  unit_price: 110,
  material_price: 0,
  auxiliary_price: 15,
  labor_price: 95,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "筒灯/射灯"), {
  item_name: "筒灯/射灯",
  metric: "hydropower_downlight_spotlight_count",
  unit: "位",
  unit_price: 95,
  material_price: 0,
  auxiliary_price: 15,
  labor_price: 80,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "设备专线"), {
  item_name: "设备专线",
  metric: "hydropower_equipment_circuit_count",
  unit: "位",
  unit_price: 180,
  material_price: 65,
  auxiliary_price: 20,
  labor_price: 95,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "弱电点位"), {
  item_name: "弱电点位",
  metric: "hydropower_weak_point_count",
  unit: "位",
  unit_price: 62,
  material_price: 5,
  auxiliary_price: 10,
  labor_price: 47,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "强电线管"), {
  item_name: "强电线管",
  metric: "hydropower_strong_conduit_length_m",
  unit: "M",
  unit_price: 38,
  material_price: 16,
  auxiliary_price: 5,
  labor_price: 17,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "弱电线管"), {
  item_name: "弱电线管",
  metric: "hydropower_weak_conduit_length_m",
  unit: "M",
  unit_price: 30,
  material_price: 12,
  auxiliary_price: 4,
  labor_price: 14,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "强电箱"), {
  item_name: "强电箱",
  metric: "hydropower_strong_box_count",
  unit: "套",
  unit_price: 850,
  material_price: 450,
  auxiliary_price: 100,
  labor_price: 300,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "弱电箱"), {
  item_name: "弱电箱",
  metric: "hydropower_weak_box_count",
  unit: "套",
  unit_price: 450,
  material_price: 220,
  auxiliary_price: 60,
  labor_price: 170,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "分配电箱"), {
  item_name: "分配电箱",
  metric: "hydropower_distribution_box_count",
  unit: "套",
  unit_price: 0,
  material_price: 0,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "给水点"), {
  item_name: "给水点",
  metric: "hydropower_water_supply_point_count",
  unit: "位",
  unit_price: 160,
  material_price: 50,
  auxiliary_price: 25,
  labor_price: 85,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "热水点"), {
  item_name: "热水点",
  metric: "hydropower_hot_water_point_count",
  unit: "位",
  unit_price: 180,
  material_price: 55,
  auxiliary_price: 30,
  labor_price: 95,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "排水点"), {
  item_name: "排水点",
  metric: "hydropower_drainage_point_count",
  unit: "位",
  unit_price: 200,
  material_price: 60,
  auxiliary_price: 35,
  labor_price: 105,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "给水管"), {
  item_name: "给水管",
  metric: "hydropower_water_pipe_length_m",
  unit: "M",
  unit_price: 55,
  material_price: 22,
  auxiliary_price: 10,
  labor_price: 23,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "排水管"), {
  item_name: "排水管",
  metric: "hydropower_drain_pipe_length_m",
  unit: "M",
  unit_price: 65,
  material_price: 25,
  auxiliary_price: 12,
  labor_price: 28,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "全屋灯饰"), {
  item_name: "全屋灯饰",
  metric: "lighting_package_count",
  unit: "套",
  unit_price: 0,
  material_price: 0,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "全屋保洁"), {
  item_name: "全屋保洁",
  metric: "cleaning_package_count",
  unit: "套",
  unit_price: 0,
  material_price: 0,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "材料搬运费"), {
  item_name: "材料搬运费",
  metric: "building_area_m2",
  unit: "M2",
  unit_price: 15,
  material_price: 0,
  auxiliary_price: 3,
  labor_price: 12,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "垃圾清运费"), {
  item_name: "垃圾清运费",
  metric: "building_area_m2",
  unit: "M2",
  unit_price: 12,
  material_price: 0,
  auxiliary_price: 0,
  labor_price: 12,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "墙地面砖现场保护"), {
  item_name: "墙地面砖现场保护",
  metric: "building_area_m2",
  unit: "M2",
  unit_price: 21,
  material_price: 0,
  auxiliary_price: 6,
  labor_price: 15,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "全屋插座开关"), {
  item_name: "全屋插座开关",
  metric: "switch_socket_package_count",
  unit: "套",
  unit_price: 20,
  material_price: 20,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "美缝"), {
  item_name: "美缝",
  metric: "tile_area_m2",
  unit: "M2",
  unit_price: 10,
  material_price: 0,
  auxiliary_price: 10,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "瓷砖加工费"), {
  item_name: "瓷砖加工费",
  metric: "tile_area_m2",
  unit: "M2",
  unit_price: 6,
  material_price: 6,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "全屋定制"), {
  item_name: "全屋定制",
  metric: "custom_cabinet_area_m2",
  unit: "M2",
  unit_price: 699,
  material_price: 699,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: undefined,
});
assert.deepEqual(rules.find((rule) => rule.item_name === "浴室柜"), {
  item_name: "浴室柜",
  metric: "bathroom_vanity_count",
  unit: "套",
  unit_price: 1800,
  material_price: 1800,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: ["卫生间"],
});
assert.deepEqual(rules.find((rule) => rule.item_name === "花洒"), {
  item_name: "花洒",
  metric: "bathroom_count",
  unit: "套",
  unit_price: 900,
  material_price: 900,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: ["卫生间"],
});
assert.deepEqual(rules.find((rule) => rule.item_name === "卫浴五件套"), {
  item_name: "卫浴五件套",
  metric: "bathroom_count",
  unit: "套",
  unit_price: 280,
  material_price: 280,
  auxiliary_price: 0,
  labor_price: 0,
  space_types: ["卫生间"],
});
assert.deepEqual(rules[0].space_types, ["客厅", "餐厅", "卧室", "书房", "茶室", "娱乐室", "过道", "门厅", "楼梯", "楼梯过道", "挑空", "衣帽间", "储物间", "露台"]);
rules[0].unit_price = 99;
rules[0].space_types?.push("厨房");
assert.equal(defaultQuoteRules()[0].unit_price, 7);
assert.deepEqual(defaultQuoteRules()[0].space_types, ["客厅", "餐厅", "卧室", "书房", "茶室", "娱乐室", "过道", "门厅", "楼梯", "楼梯过道", "挑空", "衣帽间", "储物间", "露台"]);

const editedRules = updateQuoteRuleUnitPrice(defaultQuoteRules(), 3, 128.456);
assert.equal(editedRules[3].item_name, "厨房卫生间集成吊顶");
assert.equal(editedRules[3].unit_price, 128.46);
assert.equal(defaultQuoteRules()[3].unit_price, 120);
assert.notEqual(editedRules[3], defaultQuoteRules()[3]);
assert.equal(editedRules[2].unit_price, defaultQuoteRules()[2].unit_price);
assert.throws(() => updateQuoteRuleUnitPrice(defaultQuoteRules(), 3, -1), /报价规则 unit_price 无效/);
assert.throws(() => updateQuoteRuleUnitPrice(defaultQuoteRules(), 999, 1), /报价规则不存在/);

const floorLevelingRuleIndex = defaultQuoteRules().findIndex((rule) => rule.item_name === "地面找平");
const editedPricePartRules = updateQuoteRulePricePart(updateQuoteRulePricePart(updateQuoteRulePricePart(defaultQuoteRules(), floorLevelingRuleIndex, "material_price", 12), floorLevelingRuleIndex, "auxiliary_price", 8.345), floorLevelingRuleIndex, "labor_price", 30);
assert.deepEqual(
  (({ unit_price, material_price, auxiliary_price, labor_price }) => ({ unit_price, material_price, auxiliary_price, labor_price }))(editedPricePartRules[floorLevelingRuleIndex]),
  { unit_price: 50.35, material_price: 12, auxiliary_price: 8.35, labor_price: 30 },
);
assert.equal(defaultQuoteRules()[floorLevelingRuleIndex].unit_price, 55);
assert.throws(() => updateQuoteRulePricePart(defaultQuoteRules(), floorLevelingRuleIndex, "labor_price", -1), /报价规则 labor_price 无效/);

const apartmentRules = parseQuoteRules(readFileSync(new URL("../../../quote-rules-apartment-current.json", import.meta.url), "utf8"));
assert.deepEqual(apartmentRules, defaultQuoteRules());

const legacyDefaultRules = defaultQuoteRules()
  .filter((rule) => !["窗台石铺贴", "楼梯踏步铺贴"].includes(rule.item_name))
  .map((rule) => {
    if (rule.item_name === "墙面乳胶漆") {
      return { ...rule, space_types: rule.space_types?.filter((spaceType) => spaceType !== "楼梯") };
    }
    if (rule.item_name === "楼梯扶手") {
      return { ...rule, unit_price: 0, material_price: 0 };
    }
    return rule;
  });
const coveredDefaultRules = withDefaultQuoteRuleCoverage(legacyDefaultRules);
assert.equal(coveredDefaultRules.length, defaultQuoteRules().length);
assert.ok(coveredDefaultRules.some((rule) => rule.item_name === "窗台石铺贴"));
assert.ok(coveredDefaultRules.some((rule) => rule.item_name === "楼梯踏步铺贴"));
assert.ok(coveredDefaultRules.find((rule) => rule.item_name === "墙面乳胶漆")?.space_types?.includes("楼梯"));
assert.deepEqual(
  (({ unit_price, material_price, auxiliary_price, labor_price }) => ({ unit_price, material_price, auxiliary_price, labor_price }))(coveredDefaultRules.find((rule) => rule.item_name === "楼梯扶手")!),
  { unit_price: 480, material_price: 480, auxiliary_price: 0, labor_price: 0 },
);

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
  { item_name: "花洒", metric: "bathroom_count", unit: "套", unit_price: 800, space_types: ["卫生间"] },
  { item_name: "地面瓷砖", metric: "floor_tile_piece_count", unit: "片", unit_price: 50 },
  { item_name: "强电布线", metric: "electrical_scope_area_m2", unit: "M2", unit_price: 78 },
  { item_name: "水路布管", metric: "plumbing_scope_area_m2", unit: "M2", unit_price: 29.5 },
  { item_name: "全屋灯饰", metric: "lighting_package_count", unit: "套", unit_price: 15000 },
  { item_name: "全屋定制", metric: "custom_cabinet_area_m2", unit: "M2", unit_price: 600 },
  { item_name: "背景墙", metric: "background_wall_area_m2", unit: "M2", unit_price: 280 },
]));
assert.equal(parsedWetRules[0].metric, "wall_tile_area_m2");
assert.equal(parsedWetRules[1].metric, "waterproof_area_m2");
assert.equal(parsedWetRules[2].metric, "windowsill_length_m");
assert.equal(parsedWetRules[3].metric, "curtain_wall_width_m");
assert.equal(parsedWetRules[4].metric, "kitchen_cabinet_length_m");
assert.equal(parsedWetRules[5].metric, "toilet_count");
assert.equal(parsedWetRules[6].metric, "bathroom_vanity_count");
assert.equal(parsedWetRules[7].metric, "bathroom_count");
assert.equal(parsedWetRules[8].metric, "floor_tile_piece_count");
assert.equal(parsedWetRules[9].metric, "electrical_scope_area_m2");
assert.equal(parsedWetRules[10].metric, "plumbing_scope_area_m2");
assert.equal(parsedWetRules[11].metric, "lighting_package_count");
assert.equal(parsedWetRules[12].metric, "custom_cabinet_area_m2");
assert.equal(parsedWetRules[13].metric, "background_wall_area_m2");
assert.equal(parseQuoteRules(JSON.stringify([{ item_name: "美缝", metric: "tile_area_m2", unit: "M2", unit_price: 12 }]))[0].metric, "tile_area_m2");
assert.equal(parseQuoteRules(JSON.stringify([{ item_name: "墙面瓷砖", metric: "wall_tile_piece_count", unit: "片", unit_price: 30 }]))[0].metric, "wall_tile_piece_count");
assert.equal(parseQuoteRules(JSON.stringify([{ item_name: "全屋插座开关", metric: "switch_socket_package_count", unit: "套", unit_price: 6000 }]))[0].metric, "switch_socket_package_count");
assert.equal(parseQuoteRules(JSON.stringify([{ item_name: "全屋保洁", metric: "cleaning_package_count", unit: "套", unit_price: 4500 }]))[0].metric, "cleaning_package_count");
assert.equal(parseQuoteRules(JSON.stringify([{ item_name: "花洒", metric: "bathroom_count", unit: "套", unit_price: 800 }]))[0].metric, "bathroom_count");
assert.equal(parseQuoteRules(JSON.stringify([{ item_name: "背景墙", metric: "background_wall_area_m2", unit: "M2", unit_price: 280 }]))[0].metric, "background_wall_area_m2");

const balconyMapping = buildQuoteMapping([{ ...rows[0], spaceName: "阳台", spaceType: "阳台", wallTileAreaM2: 0, waterproofAreaM2: 9 }], undefined, { building_area_m2: 88.66 });
assert.ok(balconyMapping.items.some((item) => item.item_name === "地面砖铺贴(750X1500)"));
assert.ok(!balconyMapping.items.some((item) => item.item_name === "强电布线"));
assert.ok(!balconyMapping.items.some((item) => item.item_name === "水路布管"));
assert.deepEqual(balconyMapping.items.filter((item) => ["地面瓷砖", "瓷砖加工费", "美缝"].includes(item.item_name)).map((item) => item.space_name), ["全屋", "全屋", "全屋"]);

const tiledBalconyMapping = buildQuoteMapping([{ ...rows[0], spaceName: "阳台", spaceType: "阳台", wallTileAreaM2: 14, waterproofAreaM2: 9 }], undefined, { building_area_m2: 88.66 });
assert.ok(tiledBalconyMapping.items.some((item) => item.item_name === "墙面贴瓷砖(600X1200)"));
assert.ok(!tiledBalconyMapping.items.some((item) => item.item_name === "强电布线"));
assert.ok(!tiledBalconyMapping.items.some((item) => item.item_name === "水路布管"));

const newWallMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", wallTileAreaM2: 0, waterproofAreaM2: 0, newWallAreaM2: 11.2 }]);
assert.deepEqual(newWallMapping.items.filter((item) => item.item_name === "砌砖墙").map(stripQuoteItemPriceParts), [
  {
    floor: "全屋",
    space_name: "全屋",
    space_type: "全屋",
    item_name: "砌砖墙",
    quantity: 11.2,
    unit: "M2",
    unit_price: 150,
    amount: 1680,
  },
]);

const classifiedNewWallMapping = buildQuoteMapping([
  {
    ...rows[0],
    spaceName: "客厅",
    spaceType: "客厅",
    wallTileAreaM2: 0,
    waterproofAreaM2: 0,
    newWallAreaM2: 20.4,
    newWallUnclassifiedAreaM2: 11.2,
    newWall120AreaM2: 5.6,
    newWall240AreaM2: 3.6,
  },
]);
assert.deepEqual(
  classifiedNewWallMapping.items.filter((item) => item.item_name === "砌砖墙" || item.item_name === "砌120厚砖墙" || item.item_name === "砌240厚砖墙").map(stripQuoteItemPriceParts),
  [
    {
      floor: "全屋",
      space_name: "全屋",
      space_type: "全屋",
      item_name: "砌砖墙",
      quantity: 11.2,
      unit: "M2",
      unit_price: 150,
      amount: 1680,
    },
    {
      floor: "全屋",
      space_name: "全屋",
      space_type: "全屋",
      item_name: "砌120厚砖墙",
      quantity: 5.6,
      unit: "M2",
      unit_price: 150,
      amount: 840,
    },
    {
      floor: "全屋",
      space_name: "全屋",
      space_type: "全屋",
      item_name: "砌240厚砖墙",
      quantity: 3.6,
      unit: "M2",
      unit_price: 230,
      amount: 828,
    },
  ],
);

const castSlabMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", wallTileAreaM2: 0, waterproofAreaM2: 0, castSlabAreaM2: 7.5 }]);
assert.deepEqual(castSlabMapping.items.filter((item) => item.item_name === "现浇钢筋混凝土楼板").map(stripQuoteItemPriceParts), [
  {
    floor: "全屋",
    space_name: "全屋",
    space_type: "全屋",
    item_name: "现浇钢筋混凝土楼板",
    quantity: 7.5,
    unit: "m2",
    unit_price: 320,
    amount: 2400,
  },
]);

const demolitionWallMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", wallTileAreaM2: 0, waterproofAreaM2: 0, demolitionWallAreaM2: 11.2 }]);
assert.deepEqual(demolitionWallMapping.items.filter((item) => item.item_name === "拆改及拆墙").map(stripQuoteItemPriceParts), [
  {
    floor: "全屋",
    space_name: "全屋",
    space_type: "全屋",
    item_name: "拆改及拆墙",
    quantity: 11.2,
    unit: "M2",
    unit_price: 70,
    amount: 784,
  },
]);

const interiorDoorMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", wallTileAreaM2: 0, waterproofAreaM2: 0, interiorDoorCount: 2 }]);
assert.deepEqual(interiorDoorMapping.items.filter((item) => item.item_name === "室内门").map(stripQuoteItemPriceParts), [
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
assert.deepEqual(bathroomDoorMapping.items.filter((item) => item.item_name === "卫生间门").map(stripQuoteItemPriceParts), [
  {
    floor: "一层",
    space_name: "公卫",
    space_type: "卫生间",
    item_name: "卫生间门",
    quantity: 1,
    unit: "樘",
    unit_price: 900,
    amount: 900,
  },
]);

const entryDoorMapping = buildQuoteMapping([{ ...rows[0], spaceName: "门厅", spaceType: "门厅", entryDoorCount: 1 }]);
assert.deepEqual(entryDoorMapping.items.filter((item) => item.item_name === "入户门").map(stripQuoteItemPriceParts), [
  {
    floor: "一层",
    space_name: "门厅",
    space_type: "门厅",
    item_name: "入户门",
    quantity: 1,
    unit: "樘",
  unit_price: 2500,
  amount: 2500,
  },
]);

const kitchenSlidingDoorMapping = buildQuoteMapping([
  { ...rows[0], spaceName: "厨房", spaceType: "厨房", slidingDoorAreaM2: 3.68, slidingDoorCasingLengthM: 5.95 },
]);
assert.deepEqual(kitchenSlidingDoorMapping.items.filter((item) => item.item_name === "厨房推拉门" || item.item_name === "厨房推拉门双包套").map(stripQuoteItemPriceParts), [
  {
    floor: "一层",
    space_name: "厨房",
    space_type: "厨房",
    item_name: "厨房推拉门",
    quantity: 3.68,
    unit: "m2",
    unit_price: 400,
    amount: 1472,
  },
  {
    floor: "一层",
    space_name: "厨房",
    space_type: "厨房",
    item_name: "厨房推拉门双包套",
    quantity: 5.95,
    unit: "M",
    unit_price: 110,
    amount: 654.5,
  },
]);

const balconySlidingDoorMapping = buildQuoteMapping([
  { ...rows[0], spaceName: "阳台", spaceType: "阳台", slidingDoorAreaM2: 3.96, slidingDoorCasingLengthM: 6.2 },
  { ...rows[0], spaceName: "露台", spaceType: "露台", slidingDoorAreaM2: 4.8, slidingDoorCasingLengthM: 6.8 },
]);
assert.deepEqual(balconySlidingDoorMapping.items.filter((item) => item.item_name === "阳台推拉门" || item.item_name === "阳台推拉门双包套").map(stripQuoteItemPriceParts), [
  {
    floor: "一层",
    space_name: "阳台",
    space_type: "阳台",
    item_name: "阳台推拉门",
    quantity: 3.96,
    unit: "M2",
    unit_price: 400,
    amount: 1584,
  },
  {
    floor: "一层",
    space_name: "阳台",
    space_type: "阳台",
    item_name: "阳台推拉门双包套",
    quantity: 6.2,
    unit: "M",
    unit_price: 110,
    amount: 682,
  },
  {
    floor: "一层",
    space_name: "露台",
    space_type: "露台",
    item_name: "阳台推拉门",
    quantity: 4.8,
    unit: "M2",
    unit_price: 400,
    amount: 1920,
  },
  {
    floor: "一层",
    space_name: "露台",
    space_type: "露台",
    item_name: "阳台推拉门双包套",
    quantity: 6.8,
    unit: "M",
    unit_price: 110,
    amount: 748,
  },
]);
assert.equal(balconySlidingDoorMapping.items.filter((item) => item.item_name === "厨房推拉门" || item.item_name === "厨房推拉门双包套").length, 0);

const kitchenCabinetMapping = buildQuoteMapping([{ ...rows[0], spaceName: "厨房", spaceType: "厨房", kitchenBaseCabinetLengthM: 4.3, kitchenWallCabinetLengthM: 3.0 }]);
assert.deepEqual(kitchenCabinetMapping.items.filter((item) => item.item_name === "橱柜").map(stripQuoteItemPriceParts), [
  {
    floor: "全屋",
    space_name: "全屋",
    space_type: "全屋",
    item_name: "橱柜",
    quantity: 7.3,
    unit: "M",
    unit_price: 699,
    amount: 5102.7,
  },
]);

const customCabinetMapping = buildQuoteMapping([{ ...rows[0], spaceName: "主卧", spaceType: "卧室", wallTileAreaM2: 0, waterproofAreaM2: 0, customCabinetAreaM2: 9.8 }]);
assert.deepEqual(customCabinetMapping.items.filter((item) => item.item_name === "全屋定制").map(stripQuoteItemPriceParts), [
  {
    floor: "一层",
    space_name: "主卧",
    space_type: "卧室",
    item_name: "全屋定制",
    quantity: 9.8,
    unit: "M2",
    unit_price: 699,
    amount: 6850.2,
  },
]);

const backgroundWallMapping = buildQuoteMapping([{ ...rows[0], spaceName: "客厅", spaceType: "客厅", wallTileAreaM2: 0, waterproofAreaM2: 0, backgroundWallAreaM2: 8.32 }]);
assert.deepEqual(backgroundWallMapping.items.filter((item) => item.item_name === "背景墙").map(stripQuoteItemPriceParts), [
  {
    floor: "全屋",
    space_name: "全屋",
    space_type: "全屋",
    item_name: "背景墙",
    quantity: 8.32,
    unit: "M2",
    unit_price: 280,
    amount: 2329.6,
  },
]);

const bathroomFixtureMapping = buildQuoteMapping([{ ...rows[0], spaceName: "卫生间", spaceType: "卫生间", wallTileAreaM2: 20.7, waterproofAreaM2: 21.84, toiletCount: 1, bathroomVanityCount: 1 }]);
assert.deepEqual(bathroomFixtureMapping.items.filter((item) => item.item_name === "马桶" || item.item_name === "浴室柜").map(stripQuoteItemPriceParts), [
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
    unit_price: 1800,
    amount: 1800,
  },
]);

const windowedBedroomMapping = buildQuoteMapping([{ ...rows[0], spaceName: "主卧", spaceType: "卧室", windowWidthTotalM: 1.8, windowsillLengthM: 1.8, wallTileAreaM2: 0, waterproofAreaM2: 0 }]);
const windowsillItem = windowedBedroomMapping.items.find((item) => item.item_name === "窗台石铺贴");
assert.deepEqual(windowsillItem && stripQuoteItemPriceParts(windowsillItem), {
  floor: "一层",
  space_name: "主卧",
  space_type: "卧室",
  item_name: "窗台石铺贴",
  quantity: 1.8,
  unit: "M",
  unit_price: 45,
  amount: 81,
});

const wetRoomWindowsillMapping = buildQuoteMapping([
  { ...rows[0], spaceName: "厨房", spaceType: "厨房", windowsillLengthM: 1.2 },
  { ...rows[0], spaceName: "卫生间", spaceType: "卫生间", windowsillLengthM: 0.8 },
]);
assert.ok(!wetRoomWindowsillMapping.items.some((item) => item.item_name === "窗台石铺贴"));

const terraceCeilingMapping = buildQuoteMapping([{ ...rows[0], spaceName: "露台", spaceType: "露台", ceilingAreaM2: 12, latexPaintAreaM2: 20, wallTileAreaM2: 0, waterproofAreaM2: 8 }]);
assert.ok(!terraceCeilingMapping.items.some((item) => ["轻钢龙骨平顶", "顶面批嵌", "顶面乳胶漆"].includes(item.item_name)));
assert.ok(terraceCeilingMapping.items.some((item) => item.item_name === "墙面乳胶漆"));

const oldTerraceCeilingRuleMapping = buildQuoteMapping(
  [{ ...rows[0], spaceName: "露台", spaceType: "露台", ceilingAreaM2: 12, latexPaintAreaM2: 20, wallTileAreaM2: 0, waterproofAreaM2: 8 }],
  [{ item_name: "顶面乳胶漆", metric: "ceiling_area_m2", unit: "m2", unit_price: 20, space_types: ["露台"] }],
);
assert.ok(!oldTerraceCeilingRuleMapping.items.some((item) => item.item_name === "顶面乳胶漆"));

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
    unit_price: 90,
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
    unit_price: 90,
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
    unit_price: 90,
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
    unit_price: 90,
    source: "fallback_longest_wall",
    note: "已进入金额汇总",
  },
]);
assert.deepEqual(curtainCandidateMapping.items.filter((item) => item.item_name === "暗窗帘箱").map(stripQuoteItemPriceParts), [
  {
    floor: "一层",
    space_name: "主卧",
    space_type: "卧室",
    item_name: "暗窗帘箱",
    quantity: 4.2,
    unit: "M",
    unit_price: 90,
    amount: 378,
  },
  {
    floor: "一层",
    space_name: "次卧",
    space_type: "卧室",
    item_name: "暗窗帘箱",
    quantity: 3.6,
    unit: "M",
    unit_price: 90,
    amount: 324,
  },
  {
    floor: "一层",
    space_name: "餐厅",
    space_type: "餐厅",
    item_name: "暗窗帘箱",
    quantity: 4.8,
    unit: "M",
    unit_price: 90,
    amount: 432,
  },
  {
    floor: "一层",
    space_name: "书房",
    space_type: "书房",
    item_name: "暗窗帘箱",
    quantity: 3.2,
    unit: "M",
    unit_price: 90,
    amount: 288,
  },
]);
assert.deepEqual(curtainCandidateMapping.items.filter((item) => item.item_name === "窗帘").map(stripQuoteItemPriceParts), [
  {
    floor: "全屋",
    space_name: "全屋",
    space_type: "全屋",
    item_name: "窗帘",
    quantity: 31.6,
    unit: "M",
    unit_price: 70,
    amount: 2212,
  },
]);
assert.equal(curtainCandidateMapping.summary.total_amount, 11171.68);

assert.throws(() => parseQuoteRules("{bad json"), /报价规则 JSON 格式无效/);
assert.throws(() => parseQuoteRules(JSON.stringify({ item_name: "x" })), /报价规则必须是数组/);
assert.throws(() => parseQuoteRules(JSON.stringify([{ item_name: "x", metric: "bad", unit: "m2", unit_price: 1 }])), /报价规则 metric 无效/);
assert.throws(() => parseQuoteRules(JSON.stringify([{ item_name: "x", metric: "floor_area_m2", unit: "m2", unit_price: -1 }])), /报价规则 unit_price 无效/);
assert.throws(() => parseQuoteRules(JSON.stringify([{ item_name: "x", metric: "floor_area_m2", unit: "m2", unit_price: 1, space_types: [""] }])), /报价规则 space_types 无效/);

assert.equal(quoteMappingFileName("test-case.dxf"), "test-case.quote-mapping.json");
assert.equal(quoteMappingFileName("样例数据"), "quote-mapping.json");
assert.equal(quoteRulesTemplateFileName("test-case.dxf"), "test-case.quote-rules.json");
assert.equal(quoteRulesTemplateFileName("样例数据"), "quote-rules.json");

function stripQuoteItemPriceParts<T extends { material_price?: number; auxiliary_price?: number; labor_price?: number }>(item: T): Omit<T, "material_price" | "auxiliary_price" | "labor_price"> {
  const { material_price, auxiliary_price, labor_price, ...rest } = item;
  return rest;
}
