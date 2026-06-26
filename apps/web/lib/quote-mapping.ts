import type { QuantityRow, QuantitySummary } from "./types";

type QuantityRowMetric =
  | "latexPaintAreaM2"
  | "floorAreaM2"
  | "floorTilePieceCount"
  | "electricalScopeAreaM2"
  | "plumbingScopeAreaM2"
  | "ceilingAreaM2"
  | "wallTileAreaM2"
  | "waterproofAreaM2"
  | "windowsillLengthM"
  | "curtainWallWidthM"
  | "newWallAreaM2"
  | "demolitionWallAreaM2"
  | "interiorDoorCount"
  | "bathroomDoorCount"
  | "slidingDoorAreaM2"
  | "slidingDoorCasingLengthM"
  | "kitchenBaseCabinetLengthM"
  | "kitchenWallCabinetLengthM"
  | "customCabinetAreaM2"
  | "toiletCount"
  | "bathroomVanityCount";
export type QuoteMetric =
  | "building_area_m2"
  | "latex_paint_area_m2"
  | "floor_area_m2"
  | "floor_tile_piece_count"
  | "electrical_scope_area_m2"
  | "plumbing_scope_area_m2"
  | "lighting_package_count"
  | "ceiling_area_m2"
  | "wall_tile_area_m2"
  | "waterproof_area_m2"
  | "windowsill_length_m"
  | "curtain_wall_width_m"
  | "new_wall_area_m2"
  | "demolition_wall_area_m2"
  | "interior_door_count"
  | "bathroom_door_count"
  | "sliding_door_area_m2"
  | "sliding_door_casing_length_m"
  | "kitchen_base_cabinet_length_m"
  | "kitchen_wall_cabinet_length_m"
  | "custom_cabinet_area_m2"
  | "toilet_count"
  | "bathroom_vanity_count";
type ProjectQuoteMetric = "building_area_m2" | "lighting_package_count";
type RowQuoteMetric = Exclude<QuoteMetric, ProjectQuoteMetric>;
type SummedProjectQuoteMetric =
  | "floor_tile_piece_count"
  | "electrical_scope_area_m2"
  | "plumbing_scope_area_m2"
  | "new_wall_area_m2"
  | "demolition_wall_area_m2";

export type QuoteRule = {
  item_name: string;
  metric: QuoteMetric;
  unit: string;
  unit_price: number;
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
  source: "manual";
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
  building_area_quote_readiness: BuildingAreaQuoteReadiness;
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

export const DEFAULT_QUOTE_RULES_NAME = "商品房整装默认规则";

const DRY_SPACE_TYPES = ["客厅", "餐厅", "卧室", "书房", "过道", "门厅", "楼梯过道", "衣帽间", "储物间", "露台"];
const CEILING_SPACE_TYPES = ["客厅", "餐厅", "卧室", "书房", "过道", "门厅", "楼梯过道", "衣帽间", "储物间"];
const WET_FLOOR_SPACE_TYPES = ["厨房", "卫生间", "阳台", "露台", "洗衣房"];
const WALL_TILE_SPACE_TYPES = ["厨房", "卫生间", "阳台", "露台", "洗衣房"];
const CURTAIN_SPACE_TYPES = ["客厅", "卧室", "书房"];
const KITCHEN_CABINET_SPACE_TYPES = ["厨房"];
const BATHROOM_FIXTURE_SPACE_TYPES = ["卫生间"];
const SUMMED_PROJECT_METRICS = new Set<QuoteMetric>([
  "floor_tile_piece_count",
  "electrical_scope_area_m2",
  "plumbing_scope_area_m2",
  "new_wall_area_m2",
  "demolition_wall_area_m2",
]);

const DEFAULT_RULES: QuoteRule[] = [
  { item_name: "墙面界面剂处理", metric: "latex_paint_area_m2", unit: "m2", unit_price: 7, space_types: DRY_SPACE_TYPES },
  { item_name: "墙面批嵌", metric: "latex_paint_area_m2", unit: "m2", unit_price: 25, space_types: DRY_SPACE_TYPES },
  { item_name: "墙面乳胶漆", metric: "latex_paint_area_m2", unit: "m2", unit_price: 20, space_types: DRY_SPACE_TYPES },
  { item_name: "轻钢龙骨平顶", metric: "ceiling_area_m2", unit: "m2", unit_price: 180, space_types: CEILING_SPACE_TYPES },
  { item_name: "顶面批嵌", metric: "ceiling_area_m2", unit: "m2", unit_price: 25, space_types: DRY_SPACE_TYPES },
  { item_name: "顶面乳胶漆", metric: "ceiling_area_m2", unit: "m2", unit_price: 20, space_types: DRY_SPACE_TYPES },
  { item_name: "地面找平", metric: "floor_area_m2", unit: "m2", unit_price: 56, space_types: WET_FLOOR_SPACE_TYPES },
  { item_name: "地面砖铺贴(750X1500)", metric: "floor_area_m2", unit: "m2", unit_price: 96, space_types: undefined },
  { item_name: "地面瓷砖主材", metric: "floor_tile_piece_count", unit: "片", unit_price: 50, space_types: undefined },
  { item_name: "强电布线", metric: "building_area_m2", unit: "M2", unit_price: 78, space_types: undefined },
  { item_name: "水路布管", metric: "building_area_m2", unit: "M2", unit_price: 29.5, space_types: undefined },
  { item_name: "墙面贴瓷砖(600X1200)", metric: "wall_tile_area_m2", unit: "m2", unit_price: 100, space_types: WALL_TILE_SPACE_TYPES },
  { item_name: "墙地面防漏处理", metric: "waterproof_area_m2", unit: "m2", unit_price: 51.5, space_types: WET_FLOOR_SPACE_TYPES },
  { item_name: "窗台石铺贴", metric: "windowsill_length_m", unit: "M", unit_price: 73, space_types: undefined },
  { item_name: "砌120厚砖墙", metric: "new_wall_area_m2", unit: "M2", unit_price: 170, space_types: undefined },
  { item_name: "拆改及拆墙", metric: "demolition_wall_area_m2", unit: "M2", unit_price: 60, space_types: undefined },
  { item_name: "室内门", metric: "interior_door_count", unit: "樘", unit_price: 1200, space_types: undefined },
  { item_name: "橱柜地柜", metric: "kitchen_base_cabinet_length_m", unit: "M", unit_price: 600, space_types: KITCHEN_CABINET_SPACE_TYPES },
  { item_name: "橱柜吊柜", metric: "kitchen_wall_cabinet_length_m", unit: "M", unit_price: 600, space_types: KITCHEN_CABINET_SPACE_TYPES },
  { item_name: "全屋定制", metric: "custom_cabinet_area_m2", unit: "M2", unit_price: 600, space_types: undefined },
  { item_name: "马桶", metric: "toilet_count", unit: "个", unit_price: 2500, space_types: BATHROOM_FIXTURE_SPACE_TYPES },
  { item_name: "浴室柜", metric: "bathroom_vanity_count", unit: "套", unit_price: 3000, space_types: BATHROOM_FIXTURE_SPACE_TYPES },
  { item_name: "全屋灯饰", metric: "lighting_package_count", unit: "套", unit_price: 6000, space_types: undefined },
  { item_name: "暗窗帘箱", metric: "curtain_wall_width_m", unit: "M", unit_price: 110, space_types: CURTAIN_SPACE_TYPES },
];

const APARTMENT_PENDING_METRICS: PendingQuoteMetric[] = [];

const METRIC_TO_ROW_FIELD: Record<RowQuoteMetric, QuantityRowMetric> = {
  latex_paint_area_m2: "latexPaintAreaM2",
  floor_area_m2: "floorAreaM2",
  floor_tile_piece_count: "floorTilePieceCount",
  electrical_scope_area_m2: "electricalScopeAreaM2",
  plumbing_scope_area_m2: "plumbingScopeAreaM2",
  ceiling_area_m2: "ceilingAreaM2",
  wall_tile_area_m2: "wallTileAreaM2",
  waterproof_area_m2: "waterproofAreaM2",
  windowsill_length_m: "windowsillLengthM",
  curtain_wall_width_m: "curtainWallWidthM",
  new_wall_area_m2: "newWallAreaM2",
  demolition_wall_area_m2: "demolitionWallAreaM2",
  interior_door_count: "interiorDoorCount",
  bathroom_door_count: "bathroomDoorCount",
  sliding_door_area_m2: "slidingDoorAreaM2",
  sliding_door_casing_length_m: "slidingDoorCasingLengthM",
  kitchen_base_cabinet_length_m: "kitchenBaseCabinetLengthM",
  kitchen_wall_cabinet_length_m: "kitchenWallCabinetLengthM",
  custom_cabinet_area_m2: "customCabinetAreaM2",
  toilet_count: "toiletCount",
  bathroom_vanity_count: "bathroomVanityCount",
};
const SUMMED_PROJECT_METRIC_TO_ROW_FIELD: Record<SummedProjectQuoteMetric, QuantityRowMetric> = {
  floor_tile_piece_count: "floorTilePieceCount",
  electrical_scope_area_m2: "electricalScopeAreaM2",
  plumbing_scope_area_m2: "plumbingScopeAreaM2",
  new_wall_area_m2: "newWallAreaM2",
  demolition_wall_area_m2: "demolitionWallAreaM2",
};

export function defaultQuoteRules(): QuoteRule[] {
  return DEFAULT_RULES.map((rule) => ({ ...rule, space_types: rule.space_types ? [...rule.space_types] : undefined }));
}

export function apartmentPendingQuoteMetrics(): PendingQuoteMetric[] {
  return APARTMENT_PENDING_METRICS.map((item) => ({ ...item }));
}

export function projectSummaryQuoteItems(mapping: Pick<QuoteMapping, "items">): QuoteMappingItem[] {
  return mapping.items.filter((item) => item.space_name === "全屋");
}

export function curtainQuoteReadiness(rows: QuantityRow[]): CurtainQuoteReadiness {
  const ready_space_names: string[] = [];
  const pending_space_names: string[] = [];
  for (const row of rows) {
    if (row.status === "excluded") {
      continue;
    }
    if ((row.curtainWallWidthSource === "manual" || row.curtainWallWidthSource === "matched_window_wall" || row.curtainWallWidthSource === "matched_l_shape_window") && row.curtainWallWidthM > 0) {
      ready_space_names.push(row.spaceName);
    } else if (row.curtainWallWidthSource === "fallback_longest_wall" || row.curtainWallWidthSource === "manual_required_l_shape_window") {
      pending_space_names.push(row.spaceName);
    }
  }
  return {
    ready_count: ready_space_names.length,
    pending_count: pending_space_names.length,
    ready_space_names,
    pending_space_names,
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
    .filter((row) => row.status !== "excluded" && row.curtainWallWidthSource === "manual" && row.curtainWallWidthM > 0)
    .map((row) => ({
      floor: row.floor,
      space_name: row.spaceName,
      space_type: row.spaceType,
      item_name: "暗窗帘箱",
      quantity: round2(row.curtainWallWidthM),
      unit: "M",
      unit_price: 110,
      source: "manual",
      note: "人工确认后已进入金额汇总",
    }));
}

export function buildQuoteMapping(
  rows: QuantityRow[],
  rules: QuoteRule[] = DEFAULT_RULES,
  summary?: Pick<QuantitySummary, "building_area_m2">,
  quantityHealthReadiness: QuantityHealthReadiness = { total: 0, warning: 0, info: 0, label: "当前无待确认项" },
): QuoteMapping {
  const billableRows = rows.filter((row) => row.status !== "excluded");
  const buildingAreaM2 = round2(summary?.building_area_m2 ?? 0);
  const rowRules = rules.filter((rule): rule is QuoteRule & { metric: RowQuoteMetric } => !isProjectMetric(rule.metric) && !SUMMED_PROJECT_METRICS.has(rule.metric));
  const projectRules = rules.filter((rule) => isProjectMetric(rule.metric) || SUMMED_PROJECT_METRICS.has(rule.metric));
  const rowItems = billableRows.flatMap((row) =>
    rowRules.filter((rule) => ruleAppliesToRow(rule, row)).map((rule) => {
      const quantity = round2(row[METRIC_TO_ROW_FIELD[rule.metric]]);
      return {
        floor: row.floor,
        space_name: row.spaceName,
        space_type: row.spaceType,
        item_name: rule.item_name,
        quantity,
        unit: rule.unit,
        unit_price: rule.unit_price,
        amount: round2(quantity * rule.unit_price),
      };
    }).filter((item) => item.quantity > 0),
  );
  const projectItems = buildProjectQuoteItems(billableRows, projectRules, buildingAreaM2);
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
    building_area_quote_readiness: buildingAreaQuoteReadiness(rules, buildingAreaM2),
    quantity_health_readiness: quantityHealthReadiness,
  };
}

function buildingAreaQuoteReadiness(rules: QuoteRule[], buildingAreaM2: number): BuildingAreaQuoteReadiness {
  const required_item_names = rules.filter((rule) => rule.metric === "building_area_m2").map((rule) => rule.item_name);
  return {
    building_area_m2: buildingAreaM2,
    required_item_names,
    missing_item_names: buildingAreaM2 > 0 ? [] : required_item_names,
  };
}

function buildProjectQuoteItems(billableRows: QuantityRow[], rules: QuoteRule[], buildingAreaM2: number): QuoteMappingItem[] {
  if (billableRows.length === 0) {
    return [];
  }
  return rules.map((rule) => {
    const quantity = projectRuleQuantity(billableRows, rule, buildingAreaM2);
    return {
      floor: "全屋",
      space_name: "全屋",
      space_type: "全屋",
      item_name: rule.item_name,
      quantity,
      unit: rule.unit,
      unit_price: rule.unit_price,
      amount: round2(quantity * rule.unit_price),
    };
  }).filter((item) => item.quantity > 0);
}

function projectRuleQuantity(billableRows: QuantityRow[], rule: QuoteRule, buildingAreaM2: number): number {
  if (rule.metric === "building_area_m2") {
    return buildingAreaM2;
  }
  if (rule.metric === "lighting_package_count") {
    return 1;
  }
  if (isSummedProjectMetric(rule.metric)) {
    const rowField = SUMMED_PROJECT_METRIC_TO_ROW_FIELD[rule.metric];
    return round2(
      billableRows
        .filter((row) => ruleAppliesToRow(rule, row))
        .reduce((sum, row) => sum + row[rowField], 0),
    );
  }
  return 0;
}

function isProjectMetric(metric: QuoteMetric): metric is ProjectQuoteMetric {
  return metric === "building_area_m2" || metric === "lighting_package_count";
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
  return {
    item_name: candidate.item_name.trim(),
    metric: candidate.metric,
    unit: candidate.unit.trim(),
    unit_price: round2(candidate.unit_price),
    space_types: normalizeSpaceTypes(candidate.space_types),
  };
}

function isQuoteMetric(metric: unknown): metric is QuoteMetric {
  return (
    metric === "building_area_m2" ||
    metric === "latex_paint_area_m2" ||
    metric === "floor_area_m2" ||
    metric === "floor_tile_piece_count" ||
    metric === "electrical_scope_area_m2" ||
    metric === "plumbing_scope_area_m2" ||
    metric === "lighting_package_count" ||
    metric === "ceiling_area_m2" ||
    metric === "wall_tile_area_m2" ||
    metric === "waterproof_area_m2" ||
    metric === "windowsill_length_m" ||
    metric === "curtain_wall_width_m" ||
    metric === "new_wall_area_m2" ||
    metric === "demolition_wall_area_m2" ||
    metric === "interior_door_count" ||
    metric === "bathroom_door_count" ||
    metric === "sliding_door_area_m2" ||
    metric === "sliding_door_casing_length_m" ||
    metric === "kitchen_base_cabinet_length_m" ||
    metric === "kitchen_wall_cabinet_length_m" ||
    metric === "custom_cabinet_area_m2" ||
    metric === "toilet_count" ||
    metric === "bathroom_vanity_count"
  );
}

function ruleAppliesToRow(rule: QuoteRule, row: QuantityRow) {
  if (rule.metric === "curtain_wall_width_m" && row.curtainWallWidthSource !== "manual") {
    return false;
  }
  return !rule.space_types || rule.space_types.length === 0 || rule.space_types.includes(row.spaceType);
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

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
