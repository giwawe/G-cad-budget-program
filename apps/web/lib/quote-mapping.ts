import type { HydropowerSummary, QuantityRow, QuantitySummary } from "./types";

type QuantityRowMetric =
  | "latexPaintAreaM2"
  | "floorAreaM2"
  | "floorTilePieceCount"
  | "electricalScopeAreaM2"
  | "plumbingScopeAreaM2"
  | "ceilingAreaM2"
  | "gypsumFlatCeilingAreaM2"
  | "edgeCeilingLengthM"
  | "gypsumLineCeilingLengthM"
  | "wallTileAreaM2"
  | "waterproofAreaM2"
  | "windowsillLengthM"
  | "curtainWallWidthM"
  | "newWallAreaM2"
  | "newWallUnclassifiedAreaM2"
  | "newWall120AreaM2"
  | "newWall240AreaM2"
  | "demolitionWallAreaM2"
  | "backgroundWallAreaM2"
  | "castSlabAreaM2"
  | "entryDoorCount"
  | "interiorDoorCount"
  | "bathroomDoorCount"
  | "slidingDoorAreaM2"
  | "slidingDoorCasingLengthM"
  | "kitchenBaseCabinetLengthM"
  | "kitchenWallCabinetLengthM"
  | "customCabinetAreaM2"
  | "stairRailingLengthM"
  | "guardrailLengthM"
  | "toiletCount"
  | "bathroomVanityCount";
export type QuoteMetric =
  | "building_area_m2"
  | "building_area_tenth_count"
  | "manual_count"
  | "tile_area_m2"
  | "curtain_box_length_m"
  | "cleaning_package_count"
  | "kitchen_bathroom_pipe_insulation_length_m"
  | "latex_paint_area_m2"
  | "floor_area_m2"
  | "floor_tile_piece_count"
  | "wall_tile_piece_count"
  | "electrical_scope_area_m2"
  | "plumbing_scope_area_m2"
  | "lighting_package_count"
  | "ceiling_area_m2"
  | "gypsum_flat_ceiling_area_m2"
  | "edge_ceiling_length_m"
  | "gypsum_line_ceiling_length_m"
  | "wall_tile_area_m2"
  | "waterproof_area_m2"
  | "windowsill_length_m"
  | "curtain_wall_width_m"
  | "new_wall_area_m2"
  | "new_wall_unclassified_area_m2"
  | "new_wall_120_area_m2"
  | "new_wall_240_area_m2"
  | "demolition_wall_area_m2"
  | "background_wall_area_m2"
  | "cast_slab_area_m2"
  | "entry_door_count"
  | "interior_door_count"
  | "bathroom_door_count"
  | "sliding_door_area_m2"
  | "sliding_door_casing_length_m"
  | "kitchen_cabinet_length_m"
  | "kitchen_base_cabinet_length_m"
  | "kitchen_wall_cabinet_length_m"
  | "custom_cabinet_area_m2"
  | "stair_railing_length_m"
  | "stair_tread_count"
  | "guardrail_length_m"
  | "toilet_count"
  | "bathroom_vanity_count"
  | "bathroom_count"
  | "switch_socket_package_count"
  | "hydropower_strong_outlet_count"
  | "hydropower_switch_count"
  | "hydropower_light_count"
  | "hydropower_downlight_spotlight_count"
  | "hydropower_equipment_circuit_count"
  | "hydropower_strong_box_count"
  | "hydropower_weak_box_count"
  | "hydropower_distribution_box_count"
  | "hydropower_water_supply_point_count"
  | "hydropower_drainage_point_count"
  | "hydropower_switch_point_count"
  | "hydropower_standard_outlet_count"
  | "hydropower_sofa_charging_outlet_count"
  | "hydropower_heating_outlet_count"
  | "hydropower_bed_end_fan_outlet_count"
  | "hydropower_kitchen_counter_outlet_count"
  | "hydropower_light_point_count"
  | "hydropower_weak_point_count"
  | "hydropower_ac_circuit_count"
  | "hydropower_high_power_circuit_count"
  | "hydropower_bathroom_heater_circuit_count"
  | "hydropower_smart_toilet_outlet_count"
  | "hydropower_washing_machine_outlet_count"
  | "hydropower_dryer_outlet_count"
  | "hydropower_water_purifier_outlet_count"
  | "hydropower_cold_water_point_count"
  | "hydropower_hot_water_point_count"
  | "hydropower_drain_point_count"
  | "hydropower_floor_drain_point_count"
  | "hydropower_strong_conduit_length_m"
  | "hydropower_weak_conduit_length_m"
  | "hydropower_water_pipe_length_m"
  | "hydropower_drain_pipe_length_m";
type ProjectQuoteMetric =
  | "building_area_m2"
  | "building_area_tenth_count"
  | "manual_count"
  | "tile_area_m2"
  | "curtain_box_length_m"
  | "cleaning_package_count"
  | "kitchen_bathroom_pipe_insulation_length_m"
  | "lighting_package_count"
  | "switch_socket_package_count"
  | "hydropower_strong_outlet_count"
  | "hydropower_switch_count"
  | "hydropower_light_count"
  | "hydropower_downlight_spotlight_count"
  | "hydropower_equipment_circuit_count"
  | "hydropower_strong_box_count"
  | "hydropower_weak_box_count"
  | "hydropower_distribution_box_count"
  | "hydropower_water_supply_point_count"
  | "hydropower_drainage_point_count"
  | "hydropower_switch_point_count"
  | "hydropower_standard_outlet_count"
  | "hydropower_sofa_charging_outlet_count"
  | "hydropower_heating_outlet_count"
  | "hydropower_bed_end_fan_outlet_count"
  | "hydropower_kitchen_counter_outlet_count"
  | "hydropower_light_point_count"
  | "hydropower_weak_point_count"
  | "hydropower_ac_circuit_count"
  | "hydropower_high_power_circuit_count"
  | "hydropower_bathroom_heater_circuit_count"
  | "hydropower_smart_toilet_outlet_count"
  | "hydropower_washing_machine_outlet_count"
  | "hydropower_dryer_outlet_count"
  | "hydropower_water_purifier_outlet_count"
  | "hydropower_cold_water_point_count"
  | "hydropower_hot_water_point_count"
  | "hydropower_drain_point_count"
  | "hydropower_floor_drain_point_count"
  | "hydropower_strong_conduit_length_m"
  | "hydropower_weak_conduit_length_m"
  | "hydropower_water_pipe_length_m"
  | "hydropower_drain_pipe_length_m";
type SummedProjectQuoteMetric =
  | "floor_tile_piece_count"
  | "wall_tile_piece_count"
  | "electrical_scope_area_m2"
  | "plumbing_scope_area_m2"
  | "kitchen_cabinet_length_m"
  | "new_wall_unclassified_area_m2"
  | "new_wall_120_area_m2"
  | "new_wall_240_area_m2"
  | "demolition_wall_area_m2"
  | "background_wall_area_m2"
  | "cast_slab_area_m2";
type RowQuoteMetric = Exclude<QuoteMetric, ProjectQuoteMetric | SummedProjectQuoteMetric>;
type DirectRowQuoteMetric = Exclude<RowQuoteMetric, "bathroom_count">;
type DirectFieldRowQuoteMetric = Exclude<DirectRowQuoteMetric, "stair_tread_count">;

export type QuoteRule = {
  item_name: string;
  metric: QuoteMetric;
  unit: string;
  unit_price: number;
  material_price?: number;
  auxiliary_price?: number;
  labor_price?: number;
  space_types?: string[];
};

export type PendingQuoteMetric = {
  item_name: string;
  unit: string;
  unit_price: number;
  reason: string;
  suggested_metric: string;
  source_group: string;
};

export type QuoteMappingItem = {
  floor: string;
  space_name: string;
  space_type: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  material_price?: number;
  auxiliary_price?: number;
  labor_price?: number;
  amount: number;
};

export type CurtainQuoteCandidate = {
  floor: string;
  space_name: string;
  space_type: string;
  item_name: "暗窗帘箱";
  quantity: number;
  unit: "M";
  unit_price: number;
  source: "manual" | "matched_window_wall" | "matched_l_shape_window" | "fallback_longest_wall";
  note: string;
};

export type AtriumCurtainCandidate = {
  floor: string;
  space_name: string;
  space_type: string;
  item_name: "挑空窗帘";
  width_m: number;
  height_m: number;
  area_m2: number;
  note: string;
};

export type QuoteMapping = {
  items: QuoteMappingItem[];
  summary: {
    space_count: number;
    building_area_m2: number;
    item_count: number;
    total_amount: number;
  };
  curtain_quote_readiness: CurtainQuoteReadiness;
  curtain_quote_candidates: CurtainQuoteCandidate[];
  atrium_curtain_candidates: AtriumCurtainCandidate[];
  building_area_quote_readiness: BuildingAreaQuoteReadiness;
  legacy_hydropower_area_rule_item_names: string[];
  quantity_health_readiness: QuantityHealthReadiness;
};

export type CurtainQuoteReadiness = {
  ready_count: number;
  pending_count: number;
  ready_space_names: string[];
  pending_space_names: string[];
};

export type BuildingAreaQuoteReadiness = {
  building_area_m2: number;
  required_item_names: string[];
  missing_item_names: string[];
};

export type QuantityHealthReadiness = {
  total: number;
  warning: number;
  info: number;
  label: string;
};

type BuildQuoteMappingOptions = {
  hydropowerSummary?: HydropowerSummary;
  quantityHealthReadiness?: QuantityHealthReadiness;
};

export const DEFAULT_QUOTE_RULES_NAME = "商品房整装默认规则";

const DRY_SPACE_TYPES = ["客厅", "餐厅", "卧室", "书房", "茶室", "娱乐室", "过道", "门厅", "楼梯", "楼梯过道", "挑空", "衣帽间", "储物间", "露台"];
const CEILING_SPACE_TYPES = ["客厅", "餐厅", "卧室", "书房", "茶室", "娱乐室", "过道", "门厅", "楼梯", "楼梯过道", "挑空", "衣帽间", "储物间"];
const KITCHEN_BATHROOM_SPACE_TYPES = ["厨房", "卫生间"];
const GYPSUM_CEILING_SPACE_TYPES = [...CEILING_SPACE_TYPES, ...KITCHEN_BATHROOM_SPACE_TYPES];
const CEILING_PAINT_SPACE_TYPES = [...CEILING_SPACE_TYPES, ...KITCHEN_BATHROOM_SPACE_TYPES];
const WET_FLOOR_SPACE_TYPES = ["厨房", "卫生间", "阳台", "露台", "洗衣房"];
const CURTAIN_SPACE_TYPES = ["客厅", "餐厅", "卧室", "书房", "茶室", "娱乐室"];
const KITCHEN_CABINET_SPACE_TYPES = ["厨房"];
const BALCONY_SLIDING_DOOR_SPACE_TYPES = ["阳台", "露台"];
const BATHROOM_FIXTURE_SPACE_TYPES = ["卫生间"];
const WINDOWSILL_PAVING_SPACE_TYPES = ["客厅", "餐厅", "卧室", "书房", "茶室", "娱乐室", "过道", "门厅", "楼梯", "楼梯过道", "挑空", "衣帽间", "储物间", "阳台", "露台", "洗衣房"];
const SWITCH_SOCKET_COUNT_PER_M2 = 0.8;
const DUPLICATE_MANUAL_PLACEHOLDER_ITEM_NAMES = new Set(["砌砖墙", "砌120厚砖墙", "砌240厚砖墙", "入户门", "阳台推拉门", "阳台推拉门双包套"]);
const SUMMED_PROJECT_METRICS = new Set<QuoteMetric>([
  "floor_tile_piece_count",
  "wall_tile_piece_count",
  "electrical_scope_area_m2",
  "plumbing_scope_area_m2",
  "kitchen_cabinet_length_m",
  "new_wall_unclassified_area_m2",
  "new_wall_120_area_m2",
  "new_wall_240_area_m2",
  "demolition_wall_area_m2",
  "background_wall_area_m2",
  "cast_slab_area_m2",
]);

const DEFAULT_RULES: QuoteRule[] = [
  quoteRule("墙面界面剂处理", "latex_paint_area_m2", "m2", 0, 4, 3, DRY_SPACE_TYPES),
  quoteRule("墙面批嵌", "latex_paint_area_m2", "m2", 0, 15, 10, DRY_SPACE_TYPES),
  quoteRule("墙面乳胶漆", "latex_paint_area_m2", "m2", 10, 0, 10, DRY_SPACE_TYPES),
  quoteRule("厨房卫生间集成吊顶", "ceiling_area_m2", "m2", 120, 0, 0, KITCHEN_BATHROOM_SPACE_TYPES),
  quoteRule("轻钢龙骨平顶", "gypsum_flat_ceiling_area_m2", "m2", 60, 30, 90, GYPSUM_CEILING_SPACE_TYPES),
  quoteRule("双眼皮/边吊吊顶", "edge_ceiling_length_m", "M", 35, 15, 30, GYPSUM_CEILING_SPACE_TYPES),
  quoteRule("石膏线吊顶", "gypsum_line_ceiling_length_m", "M", 12, 5, 18, GYPSUM_CEILING_SPACE_TYPES),
  quoteRule("顶面批嵌", "ceiling_area_m2", "m2", 0, 15, 10, CEILING_PAINT_SPACE_TYPES),
  quoteRule("顶面乳胶漆", "ceiling_area_m2", "m2", 10, 0, 10, CEILING_PAINT_SPACE_TYPES),
  quoteRule("地面找平", "floor_area_m2", "m2", 0, 25, 30, WET_FLOOR_SPACE_TYPES),
  quoteRule("地面砖铺贴(750X1500)", "floor_area_m2", "m2", 40, 8, 50),
  quoteRule("地面瓷砖", "floor_tile_piece_count", "片", 80, 0, 0, undefined, 90),
  quoteRule("墙面瓷砖", "wall_tile_piece_count", "片", 55, 0, 0, undefined, 40),
  quoteRule("瓷砖加工费", "tile_area_m2", "M2", 6, 0, 0),
  quoteRule("美缝", "tile_area_m2", "M2", 0, 10, 0),
  quoteRule("强电插座", "hydropower_strong_outlet_count", "位", 5, 12, 55),
  quoteRule("开关", "hydropower_switch_count", "位", 5, 10, 53),
  quoteRule("灯位", "hydropower_light_count", "位", 0, 15, 95),
  quoteRule("筒灯/射灯", "hydropower_downlight_spotlight_count", "位", 0, 15, 80),
  quoteRule("设备专线", "hydropower_equipment_circuit_count", "位", 65, 20, 95),
  quoteRule("弱电点位", "hydropower_weak_point_count", "位", 5, 10, 47),
  quoteRule("强电线管", "hydropower_strong_conduit_length_m", "M", 16, 5, 17),
  quoteRule("弱电线管", "hydropower_weak_conduit_length_m", "M", 12, 4, 14),
  quoteRule("强电箱", "hydropower_strong_box_count", "套", 450, 100, 300),
  quoteRule("弱电箱", "hydropower_weak_box_count", "套", 220, 60, 170),
  quoteRule("分配电箱", "hydropower_distribution_box_count", "套", 0, 0, 0),
  quoteRule("给水点", "hydropower_water_supply_point_count", "位", 50, 25, 85),
  quoteRule("热水点", "hydropower_hot_water_point_count", "位", 55, 30, 95),
  quoteRule("排水点", "hydropower_drainage_point_count", "位", 60, 35, 105),
  quoteRule("给水管", "hydropower_water_pipe_length_m", "M", 22, 10, 23),
  quoteRule("排水管", "hydropower_drain_pipe_length_m", "M", 25, 12, 28),
  quoteRule("材料搬运费", "building_area_m2", "M2", 0, 3, 12),
  quoteRule("垃圾清运费", "building_area_m2", "M2", 0, 0, 12),
  quoteRule("墙地面砖现场保护", "building_area_m2", "M2", 0, 6, 15),
  quoteRule("墙面贴瓷砖(600X1200)", "wall_tile_area_m2", "m2", 40, 8, 50),
  quoteRule("墙地面防漏处理", "waterproof_area_m2", "m2", 35, 7, 18, WET_FLOOR_SPACE_TYPES),
  quoteRule("窗台石铺贴", "windowsill_length_m", "M", 0, 20, 25, WINDOWSILL_PAVING_SPACE_TYPES),
  quoteRule("砌砖墙", "new_wall_unclassified_area_m2", "M2", 45, 25, 80),
  quoteRule("砌120厚砖墙", "new_wall_120_area_m2", "M2", 45, 25, 80),
  quoteRule("砌240厚砖墙", "new_wall_240_area_m2", "M2", 80, 30, 120),
  quoteRule("现浇钢筋混凝土楼板", "cast_slab_area_m2", "m2", 145, 55, 120),
  quoteRule("拆改及拆墙", "demolition_wall_area_m2", "M2", 0, 10, 60),
  quoteRule("外墙批嵌以及修补", "manual_count", "M2", 20, 15, 35),
  quoteRule("砖墙门窗洞过梁", "manual_count", "支", 100, 0, 20),
  quoteRule("水泥墙开槽", "building_area_m2", "M2", 0, 4, 8),
  quoteRule("打混凝土过梁孔", "building_area_tenth_count", "个", 0, 0, 35),
  quoteRule("厨房、卫生间排污管包隔音棉", "kitchen_bathroom_pipe_insulation_length_m", "M", 0, 35, 15),
  quoteRule("补线、管槽及零星修补", "building_area_m2", "M2", 0, 2.5, 3),
  quoteRule("背景墙", "background_wall_area_m2", "M2", 280, 0, 0),
  quoteRule("入户门", "entry_door_count", "樘", 2500, 0, 0),
  quoteRule("室内门", "interior_door_count", "樘", 1200, 0, 0),
  quoteRule("卫生间门", "bathroom_door_count", "樘", 900, 0, 0, BATHROOM_FIXTURE_SPACE_TYPES),
  quoteRule("厨房推拉门", "sliding_door_area_m2", "m2", 400, 0, 0, KITCHEN_CABINET_SPACE_TYPES),
  quoteRule("厨房推拉门双包套", "sliding_door_casing_length_m", "M", 110, 0, 0, KITCHEN_CABINET_SPACE_TYPES),
  quoteRule("阳台推拉门", "sliding_door_area_m2", "M2", 400, 0, 0, BALCONY_SLIDING_DOOR_SPACE_TYPES),
  quoteRule("阳台推拉门双包套", "sliding_door_casing_length_m", "M", 110, 0, 0, BALCONY_SLIDING_DOOR_SPACE_TYPES),
  quoteRule("楼梯扶手", "stair_railing_length_m", "M", 480, 0, 0),
  quoteRule("楼梯踏步铺贴", "stair_tread_count", "步", 0, 45, 80, ["楼梯", "楼梯过道"]),
  quoteRule("栏杆/护栏", "guardrail_length_m", "M", 450, 0, 0),
  quoteRule("铝合金封门窗", "manual_count", "M2", 600, 0, 0),
  quoteRule("橱柜", "kitchen_cabinet_length_m", "M", 699, 0, 0, KITCHEN_CABINET_SPACE_TYPES),
  quoteRule("全屋定制", "custom_cabinet_area_m2", "M2", 699, 0, 0),
  quoteRule("马桶", "toilet_count", "套", 1500, 0, 0, BATHROOM_FIXTURE_SPACE_TYPES),
  quoteRule("蹲坑", "manual_count", "套", 500, 0, 0),
  quoteRule("浴室柜", "bathroom_vanity_count", "套", 1800, 0, 0, BATHROOM_FIXTURE_SPACE_TYPES),
  quoteRule("淋浴隔断", "manual_count", "套", 800, 0, 0),
  quoteRule("玻璃淋浴房", "manual_count", "套", 1200, 0, 0),
  quoteRule("花洒", "bathroom_count", "套", 900, 0, 0, BATHROOM_FIXTURE_SPACE_TYPES),
  quoteRule("卫浴五件套", "bathroom_count", "套", 280, 0, 0, BATHROOM_FIXTURE_SPACE_TYPES),
  quoteRule("全屋插座开关", "switch_socket_package_count", "套", 20, 0, 0),
  quoteRule("全屋灯饰", "lighting_package_count", "套", 0, 0, 0),
  quoteRule("窗帘", "curtain_box_length_m", "M", 50, 20, 0),
  quoteRule("窗台石", "windowsill_length_m", "M", 65, 0, 0, WINDOWSILL_PAVING_SPACE_TYPES),
  quoteRule("全屋保洁", "cleaning_package_count", "套", 0, 0, 0),
  quoteRule("暗窗帘箱", "curtain_wall_width_m", "M", 35, 10, 45, CURTAIN_SPACE_TYPES),
];

const APARTMENT_PENDING_METRICS: PendingQuoteMetric[] = [];

const METRIC_TO_ROW_FIELD: Record<DirectFieldRowQuoteMetric, QuantityRowMetric> = {
  latex_paint_area_m2: "latexPaintAreaM2",
  floor_area_m2: "floorAreaM2",
  ceiling_area_m2: "ceilingAreaM2",
  gypsum_flat_ceiling_area_m2: "gypsumFlatCeilingAreaM2",
  edge_ceiling_length_m: "edgeCeilingLengthM",
  gypsum_line_ceiling_length_m: "gypsumLineCeilingLengthM",
  wall_tile_area_m2: "wallTileAreaM2",
  waterproof_area_m2: "waterproofAreaM2",
  windowsill_length_m: "windowsillLengthM",
  curtain_wall_width_m: "curtainWallWidthM",
  new_wall_area_m2: "newWallAreaM2",
  entry_door_count: "entryDoorCount",
  interior_door_count: "interiorDoorCount",
  bathroom_door_count: "bathroomDoorCount",
  sliding_door_area_m2: "slidingDoorAreaM2",
  sliding_door_casing_length_m: "slidingDoorCasingLengthM",
  kitchen_base_cabinet_length_m: "kitchenBaseCabinetLengthM",
  kitchen_wall_cabinet_length_m: "kitchenWallCabinetLengthM",
  custom_cabinet_area_m2: "customCabinetAreaM2",
  stair_railing_length_m: "stairRailingLengthM",
  guardrail_length_m: "guardrailLengthM",
  toilet_count: "toiletCount",
  bathroom_vanity_count: "bathroomVanityCount",
};
const SUMMED_PROJECT_METRIC_TO_ROW_FIELD: Record<SummedProjectQuoteMetric, QuantityRowMetric> = {
  floor_tile_piece_count: "floorTilePieceCount",
  wall_tile_piece_count: "wallTileAreaM2",
  electrical_scope_area_m2: "electricalScopeAreaM2",
  plumbing_scope_area_m2: "plumbingScopeAreaM2",
  new_wall_unclassified_area_m2: "newWallUnclassifiedAreaM2",
  new_wall_120_area_m2: "newWall120AreaM2",
  new_wall_240_area_m2: "newWall240AreaM2",
  demolition_wall_area_m2: "demolitionWallAreaM2",
  background_wall_area_m2: "backgroundWallAreaM2",
  cast_slab_area_m2: "castSlabAreaM2",
  kitchen_cabinet_length_m: "kitchenBaseCabinetLengthM",
};

export function defaultQuoteRules(): QuoteRule[] {
  return DEFAULT_RULES.map(cloneQuoteRule);
}

export function withDefaultQuoteRuleCoverage(rules: QuoteRule[]): QuoteRule[] {
  const remainingRules = [...rules];
  const mergedDefaultRules = DEFAULT_RULES.map((defaultRule) => {
    const existingIndex = remainingRules.findIndex((rule) => rule.item_name === defaultRule.item_name && rule.metric === defaultRule.metric);
    if (existingIndex < 0) {
      return cloneQuoteRule(defaultRule);
    }
    const existingRule = remainingRules.splice(existingIndex, 1)[0];
    const shouldUseDefaultPrice = existingRule.unit_price <= 0 && defaultRule.unit_price > 0;
    return {
      ...cloneQuoteRule(defaultRule),
      ...existingRule,
      unit: defaultRule.unit,
      unit_price: shouldUseDefaultPrice ? defaultRule.unit_price : existingRule.unit_price,
      material_price: shouldUseDefaultPrice ? defaultRule.material_price : existingRule.material_price,
      auxiliary_price: shouldUseDefaultPrice ? defaultRule.auxiliary_price : existingRule.auxiliary_price,
      labor_price: shouldUseDefaultPrice ? defaultRule.labor_price : existingRule.labor_price,
      space_types: mergeSpaceTypes(existingRule.space_types, defaultRule.space_types),
    };
  });
  return [...mergedDefaultRules, ...remainingRules.filter((rule) => !isDuplicateManualPlaceholderRule(rule)).map(cloneQuoteRule)];
}

function cloneQuoteRule(rule: QuoteRule): QuoteRule {
  return { ...rule, space_types: rule.space_types ? [...rule.space_types] : undefined };
}

function mergeSpaceTypes(existingSpaceTypes: string[] | undefined, defaultSpaceTypes: string[] | undefined): string[] | undefined {
  if (!existingSpaceTypes && !defaultSpaceTypes) {
    return undefined;
  }
  return [...new Set([...(existingSpaceTypes ?? []), ...(defaultSpaceTypes ?? [])])];
}

function isDuplicateManualPlaceholderRule(rule: QuoteRule): boolean {
  return rule.metric === "manual_count" && DUPLICATE_MANUAL_PLACEHOLDER_ITEM_NAMES.has(rule.item_name);
}

export function updateQuoteRulePricePart(rules: QuoteRule[], index: number, part: "material_price" | "auxiliary_price" | "labor_price", price: number): QuoteRule[] {
  if (!Number.isInteger(index) || index < 0 || index >= rules.length) {
    throw new Error("报价规则不存在");
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`报价规则 ${part} 无效：${String(price)}`);
  }
  return rules.map((rule, ruleIndex) => {
    if (ruleIndex !== index) {
      return rule;
    }
    const material_price = round2(part === "material_price" ? price : rule.material_price ?? rule.unit_price);
    const auxiliary_price = round2(part === "auxiliary_price" ? price : rule.auxiliary_price ?? 0);
    const labor_price = round2(part === "labor_price" ? price : rule.labor_price ?? 0);
    return {
      ...rule,
      unit_price: round2(material_price + auxiliary_price + labor_price),
      material_price,
      auxiliary_price,
      labor_price,
    };
  });
}

export function updateQuoteRuleUnitPrice(rules: QuoteRule[], index: number, unitPrice: number): QuoteRule[] {
  if (!Number.isInteger(index) || index < 0 || index >= rules.length) {
    throw new Error("报价规则不存在");
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error(`报价规则 unit_price 无效：${String(unitPrice)}`);
  }
  return updateQuoteRulePricePart(rules, index, "material_price", unitPrice).map((rule, ruleIndex) =>
    ruleIndex === index ? { ...rule, auxiliary_price: 0, labor_price: 0, unit_price: round2(unitPrice) } : rule,
  );
}

export function apartmentPendingQuoteMetrics(): PendingQuoteMetric[] {
  return APARTMENT_PENDING_METRICS.map((item) => ({ ...item }));
}

export function projectSummaryQuoteItems(mapping: Pick<QuoteMapping, "items">): QuoteMappingItem[] {
  return mapping.items.filter((item) => item.space_name === "全屋");
}

export function integratedCeilingPriceReminderItems(mapping: Pick<QuoteMapping, "items">): QuoteMappingItem[] {
  return mapping.items.filter((item) => item.item_name === "厨房卫生间集成吊顶" && item.quantity > 0 && item.unit_price <= 0);
}

export function exportQuoteMappingConfirmationMessages(mapping: QuoteMapping): string[] {
  const messages: string[] = [];
  if (mapping.quantity_health_readiness.warning > 0) {
    messages.push(`仍有 ${mapping.quantity_health_readiness.warning} 项 warning 健康检查未处理。`);
  }
  const zeroPriceIntegratedCeilingCount = integratedCeilingPriceReminderItems(mapping).length;
  if (zeroPriceIntegratedCeilingCount > 0) {
    messages.push(`厨房卫生间集成吊顶已有 ${zeroPriceIntegratedCeilingCount} 个空间工程量但单价为 0。`);
  }
  if (mapping.building_area_quote_readiness.missing_item_names.length > 0) {
    messages.push(`${mapping.building_area_quote_readiness.missing_item_names.join("、")} 需要 QUOTE_EXT_WALL 建筑面积，当前为 0。`);
  }
  return messages;
}

export function curtainQuoteReadiness(rows: QuantityRow[]): CurtainQuoteReadiness {
  const ready_space_names: string[] = [];
  for (const row of rows) {
    if (row.status === "excluded") {
      continue;
    }
    if (curtainWallWidthIsQuoteReady(row.curtainWallWidthSource) && row.curtainWallWidthM > 0) {
      ready_space_names.push(row.spaceName);
    }
  }
  return {
    ready_count: ready_space_names.length,
    pending_count: 0,
    ready_space_names,
    pending_space_names: [],
  };
}

export function formatCurtainReadinessSpaces(spaceNames: string[], limit = 4): string {
  if (spaceNames.length === 0) {
    return "暂无";
  }
  const visible = spaceNames.slice(0, limit).join("、");
  return spaceNames.length > limit ? `${visible}等 ${spaceNames.length} 个` : visible;
}

export function curtainQuoteCandidates(rows: QuantityRow[]): CurtainQuoteCandidate[] {
  return rows
    .filter((row) => row.status !== "excluded" && curtainWallWidthIsQuoteReady(row.curtainWallWidthSource) && row.curtainWallWidthM > 0)
    .map((row) => ({
      floor: row.floor,
      space_name: row.spaceName,
      space_type: row.spaceType,
      item_name: "暗窗帘箱",
      quantity: round2(row.curtainWallWidthM),
      unit: "M",
      unit_price: 90,
      source: row.curtainWallWidthSource as CurtainQuoteCandidate["source"],
      note: "已进入金额汇总",
    }));
}

export function atriumCurtainCandidates(rows: QuantityRow[]): AtriumCurtainCandidate[] {
  return rows
    .filter((row) => row.status !== "excluded" && row.spaceType === "挑空" && (row.atriumCurtainAreaM2 ?? 0) > 0)
    .map((row) => ({
      floor: row.floor,
      space_name: row.spaceName,
      space_type: row.spaceType,
      item_name: "挑空窗帘",
      width_m: round2(row.atriumCurtainWidthM ?? 0),
      height_m: round2(row.atriumCurtainHeightM ?? 0),
      area_m2: round2(row.atriumCurtainAreaM2 ?? 0),
      note: "挑空窗帘为非常规尺寸，宽度按窗户所在墙面候选，帘高按关联楼层层高汇总，需设计师复核。",
    }));
}

export function buildQuoteMapping(
  rows: QuantityRow[],
  rules: QuoteRule[] = DEFAULT_RULES,
  summary?: Pick<QuantitySummary, "building_area_m2">,
  options?: BuildQuoteMappingOptions | QuantityHealthReadiness,
): QuoteMapping {
  const billableRows = rows.filter((row) => row.status !== "excluded");
  const buildingAreaM2 = round2(summary?.building_area_m2 ?? 0);
  const normalizedOptions = normalizeBuildQuoteMappingOptions(options);
  const rowRules = rules.filter((rule): rule is QuoteRule & { metric: RowQuoteMetric } => !isProjectMetric(rule.metric) && !SUMMED_PROJECT_METRICS.has(rule.metric));
  const projectRules = rules.filter((rule) => isProjectMetric(rule.metric) || SUMMED_PROJECT_METRICS.has(rule.metric));
  const rowSpaceNames = displaySpaceNamesByRow(billableRows);
  const rowItems = billableRows.flatMap((row) =>
    rowRules.filter((rule) => ruleAppliesToRow(rule, row)).map((rule) => {
      const quantity = rowRuleQuantity(row, rule);
      return {
        floor: row.floor,
        space_name: rowSpaceNames.get(row) ?? row.spaceName,
        space_type: row.spaceType,
        item_name: rule.item_name,
        quantity,
        unit: rule.unit,
        unit_price: rule.unit_price,
        ...quoteRulePriceParts(rule),
        amount: round2(quantity * rule.unit_price),
      };
    }).filter((item) => item.quantity > 0),
  );
  const projectItems = buildProjectQuoteItems(billableRows, projectRules, buildingAreaM2, normalizedOptions.hydropowerSummary);
  const items = [...rowItems, ...projectItems];

  return {
    items,
    summary: {
      space_count: billableRows.length,
      building_area_m2: buildingAreaM2,
      item_count: items.length,
      total_amount: round2(items.reduce((sum, item) => sum + item.amount, 0)),
    },
    curtain_quote_readiness: curtainQuoteReadiness(rows),
    curtain_quote_candidates: curtainQuoteCandidates(rows),
    atrium_curtain_candidates: atriumCurtainCandidates(rows),
    building_area_quote_readiness: buildingAreaQuoteReadiness(rules, buildingAreaM2),
    legacy_hydropower_area_rule_item_names: legacyHydropowerAreaRuleItemNames(rules),
    quantity_health_readiness: normalizedOptions.quantityHealthReadiness,
  };
}

function normalizeBuildQuoteMappingOptions(options?: BuildQuoteMappingOptions | QuantityHealthReadiness): Required<Pick<BuildQuoteMappingOptions, "quantityHealthReadiness">> & Pick<BuildQuoteMappingOptions, "hydropowerSummary"> {
  const defaultQuantityHealthReadiness: QuantityHealthReadiness = { total: 0, warning: 0, info: 0, label: "当前无待确认项" };
  if (!options) {
    return { hydropowerSummary: undefined, quantityHealthReadiness: defaultQuantityHealthReadiness };
  }
  if (isQuantityHealthReadiness(options)) {
    return {
      hydropowerSummary: undefined,
      quantityHealthReadiness: options,
    };
  }
  return {
    hydropowerSummary: options.hydropowerSummary,
    quantityHealthReadiness: options.quantityHealthReadiness ?? defaultQuantityHealthReadiness,
  };
}

function isQuantityHealthReadiness(options: BuildQuoteMappingOptions | QuantityHealthReadiness): options is QuantityHealthReadiness {
  return (
    typeof (options as QuantityHealthReadiness).total === "number" &&
    typeof (options as QuantityHealthReadiness).warning === "number" &&
    typeof (options as QuantityHealthReadiness).info === "number" &&
    typeof (options as QuantityHealthReadiness).label === "string"
  );
}

function displaySpaceNamesByRow(rows: QuantityRow[]): Map<QuantityRow, string> {
  const totalByName = new Map<string, number>();
  rows.forEach((row) => {
    const key = `${row.floor}::${row.spaceName}`;
    totalByName.set(key, (totalByName.get(key) ?? 0) + 1);
  });
  const seenByName = new Map<string, number>();
  return new Map(
    rows.map((row) => {
      const key = `${row.floor}::${row.spaceName}`;
      const total = totalByName.get(key) ?? 0;
      if (total <= 1) {
        return [row, row.spaceName] as const;
      }
      const nextIndex = (seenByName.get(key) ?? 0) + 1;
      seenByName.set(key, nextIndex);
      return [row, `${row.spaceName}${chineseOrdinal(nextIndex)}`] as const;
    }),
  );
}

function chineseOrdinal(index: number): string {
  const numerals = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (index <= 10) {
    return index === 10 ? "十" : numerals[index];
  }
  if (index < 20) {
    return `十${numerals[index - 10]}`;
  }
  const tens = Math.floor(index / 10);
  const ones = index % 10;
  return `${numerals[tens]}十${ones === 0 ? "" : numerals[ones]}`;
}

function rowRuleQuantity(row: QuantityRow, rule: QuoteRule & { metric: RowQuoteMetric }): number {
  if (rule.metric === "bathroom_count") {
    return 1;
  }
  if (rule.metric === "stair_tread_count") {
    return stairTreadCount(row.heightM);
  }
  if (rule.metric === "gypsum_flat_ceiling_area_m2") {
    return round2(row.gypsumFlatCeilingAreaM2 ?? row.ceilingAreaM2);
  }
  return round2(row[METRIC_TO_ROW_FIELD[rule.metric]] ?? 0);
}

function stairTreadCount(heightM: number): number {
  if (!Number.isFinite(heightM) || heightM <= 0) {
    return 0;
  }
  const rawCount = Math.floor(heightM / 0.17);
  return rawCount % 2 === 1 ? rawCount : Math.max(rawCount - 1, 0);
}

function buildingAreaQuoteReadiness(rules: QuoteRule[], buildingAreaM2: number): BuildingAreaQuoteReadiness {
  const required_item_names = rules.filter((rule) => rule.metric === "building_area_m2").map((rule) => rule.item_name);
  return {
    building_area_m2: buildingAreaM2,
    required_item_names,
    missing_item_names: buildingAreaM2 > 0 ? [] : required_item_names,
  };
}

function legacyHydropowerAreaRuleItemNames(rules: QuoteRule[]): string[] {
  return rules
    .filter((rule) => rule.metric === "electrical_scope_area_m2" || rule.metric === "plumbing_scope_area_m2")
    .map((rule) => rule.item_name);
}

function buildProjectQuoteItems(billableRows: QuantityRow[], rules: QuoteRule[], buildingAreaM2: number, hydropowerSummary?: HydropowerSummary): QuoteMappingItem[] {
  if (billableRows.length === 0) {
    return [];
  }
  return rules.map((rule) => {
    const quantity = projectRuleQuantity(billableRows, rule, buildingAreaM2, hydropowerSummary);
    const amount = projectRuleAmount(quantity, rule, buildingAreaM2);
    return {
      floor: "全屋",
      space_name: "全屋",
      space_type: "全屋",
      item_name: rule.item_name,
      quantity,
      unit: rule.unit,
      unit_price: rule.unit_price,
      ...quoteRulePriceParts(rule),
      amount,
    };
  }).filter((item) => item.quantity > 0);
}

function projectRuleAmount(quantity: number, rule: QuoteRule, buildingAreaM2: number): number {
  if (rule.metric === "switch_socket_package_count") {
    return round2(Math.ceil(buildingAreaM2 * SWITCH_SOCKET_COUNT_PER_M2) * rule.unit_price);
  }
  return round2(quantity * rule.unit_price);
}

function quoteRulePriceParts(rule: QuoteRule): Pick<QuoteMappingItem, "material_price" | "auxiliary_price" | "labor_price"> {
  if (rule.material_price === undefined && rule.auxiliary_price === undefined && rule.labor_price === undefined) {
    return {};
  }
  return {
    material_price: rule.material_price ?? 0,
    auxiliary_price: rule.auxiliary_price ?? 0,
    labor_price: rule.labor_price ?? 0,
  };
}

function aggregateHydropowerQuoteMetrics(summary: HydropowerSummary) {
  return {
    strongOutletCount:
      summary.standardOutletCount +
      summary.sofaChargingOutletCount +
      summary.heatingOutletCount +
      summary.bedEndFanOutletCount +
      summary.kitchenCounterOutletCount +
      summary.smartToiletOutletCount +
      summary.washingMachineOutletCount +
      summary.dryerOutletCount +
      summary.waterPurifierOutletCount,
    switchCount: summary.switchPointCount,
    lightCount: summary.lightPointCount,
    downlightSpotlightCount: 0,
    equipmentCircuitCount: summary.acCircuitCount + summary.highPowerCircuitCount + summary.bathroomHeaterCircuitCount,
    weakPointCount: summary.weakPointCount,
    strongConduitLengthM: round2(summary.strongConduitLengthM),
    weakConduitLengthM: round2(summary.weakConduitLengthM),
    strongBoxCount: 1,
    weakBoxCount: 1,
    distributionBoxCount: 0,
    waterSupplyPointCount: summary.coldWaterPointCount,
    hotWaterPointCount: summary.hotWaterPointCount,
    drainagePointCount: summary.drainPointCount + summary.floorDrainPointCount,
    waterPipeLengthM: round2(summary.waterPipeLengthM),
    drainPipeLengthM: round2(summary.drainPipeLengthM),
  };
}

function projectRuleQuantity(billableRows: QuantityRow[], rule: QuoteRule, buildingAreaM2: number, hydropowerSummary?: HydropowerSummary): number {
  const hydropowerQuoteSummary = hydropowerSummary ? aggregateHydropowerQuoteMetrics(hydropowerSummary) : undefined;
  const hydropowerMetrics: Partial<Record<QuoteMetric, number>> = {
    hydropower_strong_outlet_count: hydropowerQuoteSummary?.strongOutletCount ?? 0,
    hydropower_switch_count: hydropowerQuoteSummary?.switchCount ?? 0,
    hydropower_light_count: hydropowerQuoteSummary?.lightCount ?? 0,
    hydropower_downlight_spotlight_count: hydropowerQuoteSummary?.downlightSpotlightCount ?? 0,
    hydropower_equipment_circuit_count: hydropowerQuoteSummary?.equipmentCircuitCount ?? 0,
    hydropower_strong_box_count: hydropowerQuoteSummary?.strongBoxCount ?? 0,
    hydropower_weak_box_count: hydropowerQuoteSummary?.weakBoxCount ?? 0,
    hydropower_distribution_box_count: hydropowerQuoteSummary?.distributionBoxCount ?? 0,
    hydropower_water_supply_point_count: hydropowerQuoteSummary?.waterSupplyPointCount ?? 0,
    hydropower_drainage_point_count: hydropowerQuoteSummary?.drainagePointCount ?? 0,
    hydropower_switch_point_count: hydropowerSummary?.switchPointCount ?? 0,
    hydropower_standard_outlet_count: hydropowerSummary?.standardOutletCount ?? 0,
    hydropower_sofa_charging_outlet_count: hydropowerSummary?.sofaChargingOutletCount ?? 0,
    hydropower_heating_outlet_count: hydropowerSummary?.heatingOutletCount ?? 0,
    hydropower_bed_end_fan_outlet_count: hydropowerSummary?.bedEndFanOutletCount ?? 0,
    hydropower_kitchen_counter_outlet_count: hydropowerSummary?.kitchenCounterOutletCount ?? 0,
    hydropower_light_point_count: hydropowerSummary?.lightPointCount ?? 0,
    hydropower_weak_point_count: hydropowerSummary?.weakPointCount ?? 0,
    hydropower_ac_circuit_count: hydropowerSummary?.acCircuitCount ?? 0,
    hydropower_high_power_circuit_count: hydropowerSummary?.highPowerCircuitCount ?? 0,
    hydropower_bathroom_heater_circuit_count: hydropowerSummary?.bathroomHeaterCircuitCount ?? 0,
    hydropower_smart_toilet_outlet_count: hydropowerSummary?.smartToiletOutletCount ?? 0,
    hydropower_washing_machine_outlet_count: hydropowerSummary?.washingMachineOutletCount ?? 0,
    hydropower_dryer_outlet_count: hydropowerSummary?.dryerOutletCount ?? 0,
    hydropower_water_purifier_outlet_count: hydropowerSummary?.waterPurifierOutletCount ?? 0,
    hydropower_cold_water_point_count: hydropowerSummary?.coldWaterPointCount ?? 0,
    hydropower_hot_water_point_count: hydropowerSummary?.hotWaterPointCount ?? 0,
    hydropower_drain_point_count: hydropowerSummary?.drainPointCount ?? 0,
    hydropower_floor_drain_point_count: hydropowerSummary?.floorDrainPointCount ?? 0,
    hydropower_strong_conduit_length_m: hydropowerSummary?.strongConduitLengthM ?? 0,
    hydropower_weak_conduit_length_m: hydropowerSummary?.weakConduitLengthM ?? 0,
    hydropower_water_pipe_length_m: hydropowerSummary?.waterPipeLengthM ?? 0,
    hydropower_drain_pipe_length_m: hydropowerSummary?.drainPipeLengthM ?? 0,
  };
  const hydropowerQuantity = hydropowerMetrics[rule.metric];
  if (hydropowerQuantity !== undefined) {
    return round2(hydropowerQuantity);
  }
  if (rule.metric === "building_area_m2") {
    return buildingAreaM2;
  }
  if (rule.metric === "building_area_tenth_count") {
    return round2(buildingAreaM2 * 0.1);
  }
  if (rule.metric === "manual_count") {
    return 0;
  }
  if (rule.metric === "lighting_package_count") {
    return 1;
  }
  if (rule.metric === "cleaning_package_count") {
    return 1;
  }
  if (rule.metric === "switch_socket_package_count") {
    return 1;
  }
  if (rule.metric === "tile_area_m2") {
    return round2(
      billableRows
        .filter((row) => ruleAppliesToRow(rule, row))
        .reduce((sum, row) => sum + row.floorAreaM2 + row.wallTileAreaM2, 0),
    );
  }
  if (rule.metric === "curtain_box_length_m") {
    return round2(
      billableRows
        .filter((row) => ruleAppliesToRow({ ...rule, space_types: CURTAIN_SPACE_TYPES }, row))
        .reduce((sum, row) => sum + (curtainWallWidthIsQuoteReady(row.curtainWallWidthSource) ? row.curtainWallWidthM * 2 : 0), 0),
    );
  }
  if (rule.metric === "kitchen_bathroom_pipe_insulation_length_m") {
    return round2(
      billableRows
        .filter((row) => KITCHEN_BATHROOM_SPACE_TYPES.includes(row.spaceType))
        .reduce((sum, row) => sum + 1.5 * row.heightM, 0),
    );
  }
  if (rule.metric === "kitchen_cabinet_length_m") {
    return round2(
      billableRows
        .filter((row) => ruleAppliesToRow(rule, row))
        .reduce((sum, row) => sum + row.kitchenBaseCabinetLengthM + row.kitchenWallCabinetLengthM, 0),
    );
  }
  if (isSummedProjectMetric(rule.metric)) {
    const summedMetric = rule.metric;
    if (summedMetric === "wall_tile_piece_count") {
      return round2(
        billableRows
          .filter((row) => ruleAppliesToRow(rule, row))
          .reduce((sum, row) => sum + Math.ceil((row.wallTileAreaM2 * 1.05) / (0.6 * 1.2)), 0),
      );
    }
    const rowField = SUMMED_PROJECT_METRIC_TO_ROW_FIELD[summedMetric];
    return round2(
      billableRows
        .filter((row) => ruleAppliesToRow(rule, row))
        .reduce((sum, row) => sum + summedProjectMetricValue(row, summedMetric, rowField), 0),
    );
  }
  return 0;
}

function summedProjectMetricValue(row: QuantityRow, metric: SummedProjectQuoteMetric, rowField: QuantityRowMetric): number {
  if (metric === "new_wall_unclassified_area_m2" && row.newWallUnclassifiedAreaM2 === undefined) {
    return row.newWallAreaM2;
  }
  return row[rowField] ?? 0;
}

function isProjectMetric(metric: QuoteMetric): metric is ProjectQuoteMetric {
  return (
    metric === "building_area_m2" ||
    metric === "building_area_tenth_count" ||
    metric === "manual_count" ||
    metric === "tile_area_m2" ||
    metric === "curtain_box_length_m" ||
    metric === "cleaning_package_count" ||
    metric === "kitchen_bathroom_pipe_insulation_length_m" ||
    metric === "lighting_package_count" ||
    metric === "switch_socket_package_count" ||
    metric === "hydropower_strong_outlet_count" ||
    metric === "hydropower_switch_count" ||
    metric === "hydropower_light_count" ||
    metric === "hydropower_downlight_spotlight_count" ||
    metric === "hydropower_equipment_circuit_count" ||
    metric === "hydropower_strong_box_count" ||
    metric === "hydropower_weak_box_count" ||
    metric === "hydropower_distribution_box_count" ||
    metric === "hydropower_water_supply_point_count" ||
    metric === "hydropower_drainage_point_count" ||
    metric === "hydropower_switch_point_count" ||
    metric === "hydropower_standard_outlet_count" ||
    metric === "hydropower_sofa_charging_outlet_count" ||
    metric === "hydropower_heating_outlet_count" ||
    metric === "hydropower_bed_end_fan_outlet_count" ||
    metric === "hydropower_kitchen_counter_outlet_count" ||
    metric === "hydropower_light_point_count" ||
    metric === "hydropower_weak_point_count" ||
    metric === "hydropower_ac_circuit_count" ||
    metric === "hydropower_high_power_circuit_count" ||
    metric === "hydropower_bathroom_heater_circuit_count" ||
    metric === "hydropower_smart_toilet_outlet_count" ||
    metric === "hydropower_washing_machine_outlet_count" ||
    metric === "hydropower_dryer_outlet_count" ||
    metric === "hydropower_water_purifier_outlet_count" ||
    metric === "hydropower_cold_water_point_count" ||
    metric === "hydropower_hot_water_point_count" ||
    metric === "hydropower_drain_point_count" ||
    metric === "hydropower_floor_drain_point_count" ||
    metric === "hydropower_strong_conduit_length_m" ||
    metric === "hydropower_weak_conduit_length_m" ||
    metric === "hydropower_water_pipe_length_m" ||
    metric === "hydropower_drain_pipe_length_m"
  );
}

function isSummedProjectMetric(metric: QuoteMetric): metric is SummedProjectQuoteMetric {
  return SUMMED_PROJECT_METRICS.has(metric);
}

export function quoteMappingFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "quote-mapping.json";
  }
  return `${trimmed.replace(/\.[^.]+$/, "")}.quote-mapping.json`;
}

export function quoteRulesTemplateFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed === "样例数据") {
    return "quote-rules.json";
  }
  return `${trimmed.replace(/\.[^.]+$/, "")}.quote-rules.json`;
}

export function parseQuoteRules(content: string): QuoteRule[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("报价规则 JSON 格式无效");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("报价规则必须是数组");
  }
  return parsed.map((rule, index) => normalizeQuoteRule(rule, index));
}

function normalizeQuoteRule(rule: unknown, index: number): QuoteRule {
  if (!rule || typeof rule !== "object") {
    throw new Error(`报价规则第 ${index + 1} 项格式无效`);
  }
  const candidate = rule as Partial<QuoteRule>;
  if (typeof candidate.item_name !== "string" || !candidate.item_name.trim()) {
    throw new Error(`报价规则第 ${index + 1} 项缺少 item_name`);
  }
  if (!isQuoteMetric(candidate.metric)) {
    throw new Error(`报价规则 metric 无效：${String(candidate.metric)}`);
  }
  if (typeof candidate.unit !== "string" || !candidate.unit.trim()) {
    throw new Error(`报价规则第 ${index + 1} 项缺少 unit`);
  }
  if (typeof candidate.unit_price !== "number" || !Number.isFinite(candidate.unit_price) || candidate.unit_price < 0) {
    throw new Error(`报价规则 unit_price 无效：${String(candidate.unit_price)}`);
  }
  const priceParts = normalizeQuoteRulePriceParts(candidate, index);
  return {
    item_name: candidate.item_name.trim(),
    metric: candidate.metric,
    unit: candidate.unit.trim(),
    unit_price: round2(candidate.unit_price),
    ...priceParts,
    space_types: normalizeSpaceTypes(candidate.space_types),
  };
}

function isQuoteMetric(metric: unknown): metric is QuoteMetric {
  return (
    metric === "building_area_m2" ||
    metric === "building_area_tenth_count" ||
    metric === "manual_count" ||
    metric === "tile_area_m2" ||
    metric === "curtain_box_length_m" ||
    metric === "cleaning_package_count" ||
    metric === "kitchen_bathroom_pipe_insulation_length_m" ||
    metric === "latex_paint_area_m2" ||
    metric === "floor_area_m2" ||
    metric === "floor_tile_piece_count" ||
    metric === "wall_tile_piece_count" ||
    metric === "electrical_scope_area_m2" ||
    metric === "plumbing_scope_area_m2" ||
    metric === "lighting_package_count" ||
    metric === "ceiling_area_m2" ||
    metric === "gypsum_flat_ceiling_area_m2" ||
    metric === "edge_ceiling_length_m" ||
    metric === "gypsum_line_ceiling_length_m" ||
    metric === "wall_tile_area_m2" ||
    metric === "waterproof_area_m2" ||
    metric === "windowsill_length_m" ||
    metric === "curtain_wall_width_m" ||
    metric === "new_wall_area_m2" ||
    metric === "new_wall_unclassified_area_m2" ||
    metric === "new_wall_120_area_m2" ||
    metric === "new_wall_240_area_m2" ||
    metric === "demolition_wall_area_m2" ||
    metric === "background_wall_area_m2" ||
    metric === "cast_slab_area_m2" ||
    metric === "entry_door_count" ||
    metric === "interior_door_count" ||
    metric === "bathroom_door_count" ||
    metric === "sliding_door_area_m2" ||
    metric === "sliding_door_casing_length_m" ||
    metric === "kitchen_cabinet_length_m" ||
    metric === "kitchen_base_cabinet_length_m" ||
    metric === "kitchen_wall_cabinet_length_m" ||
    metric === "custom_cabinet_area_m2" ||
    metric === "stair_railing_length_m" ||
    metric === "stair_tread_count" ||
    metric === "guardrail_length_m" ||
    metric === "toilet_count" ||
    metric === "bathroom_vanity_count" ||
    metric === "bathroom_count" ||
    metric === "switch_socket_package_count" ||
    metric === "hydropower_strong_outlet_count" ||
    metric === "hydropower_switch_count" ||
    metric === "hydropower_light_count" ||
    metric === "hydropower_downlight_spotlight_count" ||
    metric === "hydropower_equipment_circuit_count" ||
    metric === "hydropower_strong_box_count" ||
    metric === "hydropower_weak_box_count" ||
    metric === "hydropower_distribution_box_count" ||
    metric === "hydropower_water_supply_point_count" ||
    metric === "hydropower_drainage_point_count" ||
    metric === "hydropower_switch_point_count" ||
    metric === "hydropower_standard_outlet_count" ||
    metric === "hydropower_sofa_charging_outlet_count" ||
    metric === "hydropower_heating_outlet_count" ||
    metric === "hydropower_bed_end_fan_outlet_count" ||
    metric === "hydropower_kitchen_counter_outlet_count" ||
    metric === "hydropower_light_point_count" ||
    metric === "hydropower_weak_point_count" ||
    metric === "hydropower_ac_circuit_count" ||
    metric === "hydropower_high_power_circuit_count" ||
    metric === "hydropower_bathroom_heater_circuit_count" ||
    metric === "hydropower_smart_toilet_outlet_count" ||
    metric === "hydropower_washing_machine_outlet_count" ||
    metric === "hydropower_dryer_outlet_count" ||
    metric === "hydropower_water_purifier_outlet_count" ||
    metric === "hydropower_cold_water_point_count" ||
    metric === "hydropower_hot_water_point_count" ||
    metric === "hydropower_drain_point_count" ||
    metric === "hydropower_floor_drain_point_count" ||
    metric === "hydropower_strong_conduit_length_m" ||
    metric === "hydropower_weak_conduit_length_m" ||
    metric === "hydropower_water_pipe_length_m" ||
    metric === "hydropower_drain_pipe_length_m"
  );
}

function ruleAppliesToRow(rule: QuoteRule, row: QuantityRow) {
  if (rule.metric === "stair_tread_count") {
    return isStairTreadQuoteRow(row);
  }
  if (rule.metric === "curtain_wall_width_m" && !curtainWallWidthIsQuoteReady(row.curtainWallWidthSource)) {
    return false;
  }
  if ((rule.metric === "ceiling_area_m2" || rule.metric === "gypsum_flat_ceiling_area_m2" || rule.metric === "edge_ceiling_length_m" || rule.metric === "gypsum_line_ceiling_length_m") && row.spaceType === "露台") {
    return false;
  }
  if ((rule.metric === "ceiling_area_m2" || rule.metric === "gypsum_flat_ceiling_area_m2" || rule.metric === "edge_ceiling_length_m" || rule.metric === "gypsum_line_ceiling_length_m") && KITCHEN_BATHROOM_SPACE_TYPES.includes(row.spaceType)) {
    const finishType = row.ceilingFinishType ?? "integrated";
    if (rule.item_name === "厨房卫生间集成吊顶") {
      return finishType === "integrated";
    }
    if (["轻钢龙骨平顶", "双眼皮/边吊吊顶", "石膏线吊顶", "顶面批嵌", "顶面乳胶漆"].includes(rule.item_name)) {
      return finishType === "gypsum";
    }
  }
  return !rule.space_types || rule.space_types.length === 0 || rule.space_types.includes(row.spaceType);
}

function isStairTreadQuoteRow(row: QuantityRow): boolean {
  if (row.spaceType === "楼梯" || row.spaceType === "楼梯过道") {
    return true;
  }
  const hasVerticalOpening = (row.voidAreaM2 ?? 0) > 0 || row.floorAreaM2 < (row.grossFloorAreaM2 ?? row.floorAreaM2) || row.ceilingAreaM2 < (row.grossFloorAreaM2 ?? row.ceilingAreaM2);
  return hasVerticalOpening && /楼梯|楼梯洞|楼梯间|电梯井|楼板洞口|楼板开洞/.test(row.spaceName);
}

function curtainWallWidthIsQuoteReady(source: QuantityRow["curtainWallWidthSource"]) {
  return source === "manual" || source === "matched_window_wall" || source === "matched_l_shape_window" || source === "fallback_longest_wall";
}

function normalizeSpaceTypes(spaceTypes: unknown): string[] | undefined {
  if (spaceTypes === undefined) {
    return undefined;
  }
  if (!Array.isArray(spaceTypes) || !spaceTypes.every((item) => typeof item === "string" && item.trim())) {
    throw new Error("报价规则 space_types 无效");
  }
  return spaceTypes.map((item) => item.trim());
}

function normalizeQuoteRulePriceParts(rule: Partial<QuoteRule>, index: number): Pick<QuoteRule, "material_price" | "auxiliary_price" | "labor_price"> {
  const priceKeys: Array<keyof Pick<QuoteRule, "material_price" | "auxiliary_price" | "labor_price">> = ["material_price", "auxiliary_price", "labor_price"];
  const hasAnyPart = priceKeys.some((key) => rule[key] !== undefined);
  if (!hasAnyPart) {
    return {};
  }
  for (const key of priceKeys) {
    const value = rule[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`报价规则第 ${index + 1} 项 ${key} 无效：${String(value)}`);
    }
  }
  return {
    material_price: round2(rule.material_price ?? 0),
    auxiliary_price: round2(rule.auxiliary_price ?? 0),
    labor_price: round2(rule.labor_price ?? 0),
  };
}

function quoteRule(
  item_name: string,
  metric: QuoteMetric,
  unit: string,
  material_price: number,
  auxiliary_price: number,
  labor_price: number,
  space_types?: string[],
  unit_price?: number,
): QuoteRule {
  return {
    item_name,
    metric,
    unit,
    unit_price: round2(unit_price ?? material_price + auxiliary_price + labor_price),
    material_price,
    auxiliary_price,
    labor_price,
    space_types,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
