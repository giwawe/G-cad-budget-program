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
  | "backgroundWallAreaM2"
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
  | "tile_area_m2"
  | "cleaning_package_count"
  | "latex_paint_area_m2"
  | "floor_area_m2"
  | "floor_tile_piece_count"
  | "wall_tile_piece_count"
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
  | "background_wall_area_m2"
  | "interior_door_count"
  | "bathroom_door_count"
  | "sliding_door_area_m2"
  | "sliding_door_casing_length_m"
  | "kitchen_cabinet_length_m"
  | "kitchen_base_cabinet_length_m"
  | "kitchen_wall_cabinet_length_m"
  | "custom_cabinet_area_m2"
  | "toilet_count"
  | "bathroom_vanity_count"
  | "bathroom_count"
  | "switch_socket_package_count";
type ProjectQuoteMetric =
  | "building_area_m2"
  | "tile_area_m2"
  | "cleaning_package_count"
  | "lighting_package_count"
  | "switch_socket_package_count";
type SummedProjectQuoteMetric =
  | "floor_tile_piece_count"
  | "wall_tile_piece_count"
  | "electrical_scope_area_m2"
  | "plumbing_scope_area_m2"
  | "kitchen_cabinet_length_m"
  | "new_wall_area_m2"
  | "demolition_wall_area_m2"
  | "background_wall_area_m2";
type RowQuoteMetric = Exclude<QuoteMetric, ProjectQuoteMetric | SummedProjectQuoteMetric>;
type DirectRowQuoteMetric = Exclude<RowQuoteMetric, "bathroom_count">;

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
const KITCHEN_BATHROOM_SPACE_TYPES = ["厨房", "卫生间"];
const GYPSUM_CEILING_SPACE_TYPES = [...CEILING_SPACE_TYPES, ...KITCHEN_BATHROOM_SPACE_TYPES];
const CEILING_PAINT_SPACE_TYPES = [...DRY_SPACE_TYPES, ...KITCHEN_BATHROOM_SPACE_TYPES];
const WET_FLOOR_SPACE_TYPES = ["厨房", "卫生间", "阳台", "露台", "洗衣房"];
const CURTAIN_SPACE_TYPES = ["客厅", "餐厅", "卧室", "书房"];
const KITCHEN_CABINET_SPACE_TYPES = ["厨房"];
const BATHROOM_FIXTURE_SPACE_TYPES = ["卫生间"];
const SUMMED_PROJECT_METRICS = new Set<QuoteMetric>([
  "floor_tile_piece_count",
  "wall_tile_piece_count",
  "electrical_scope_area_m2",
  "plumbing_scope_area_m2",
  "kitchen_cabinet_length_m",
  "new_wall_area_m2",
  "demolition_wall_area_m2",
  "background_wall_area_m2",
]);

const DEFAULT_RULES: QuoteRule[] = [
  quoteRule("墙面界面剂处理", "latex_paint_area_m2", "m2", 0, 4, 3, DRY_SPACE_TYPES),
  quoteRule("墙面批嵌", "latex_paint_area_m2", "m2", 0, 15, 10, DRY_SPACE_TYPES),
  quoteRule("墙面乳胶漆", "latex_paint_area_m2", "m2", 10, 0, 10, DRY_SPACE_TYPES),
  quoteRule("厨房卫生间集成吊顶", "ceiling_area_m2", "m2", 260, 0, 0, KITCHEN_BATHROOM_SPACE_TYPES),
  quoteRule("轻钢龙骨平顶", "ceiling_area_m2", "m2", 110, 10, 60, GYPSUM_CEILING_SPACE_TYPES),
  quoteRule("顶面批嵌", "ceiling_area_m2", "m2", 0, 15, 10, CEILING_PAINT_SPACE_TYPES),
  quoteRule("顶面乳胶漆", "ceiling_area_m2", "m2", 10, 0, 10, CEILING_PAINT_SPACE_TYPES),
  quoteRule("地面找平", "floor_area_m2", "m2", 0, 26, 30, WET_FLOOR_SPACE_TYPES),
  quoteRule("地面砖铺贴(750X1500)", "floor_area_m2", "m2", 0, 36, 60),
  quoteRule("地面瓷砖", "floor_tile_piece_count", "片", 50, 0, 0),
  quoteRule("墙面瓷砖", "wall_tile_piece_count", "片", 30, 0, 0),
  quoteRule("瓷砖加工费", "tile_area_m2", "M2", 20, 0, 0),
  quoteRule("美缝", "tile_area_m2", "M2", 0, 12, 0),
  quoteRule("强电布线", "building_area_m2", "M2", 40, 0, 38),
  quoteRule("弱电布线", "building_area_m2", "M2", 15, 0, 10),
  quoteRule("水路布管", "building_area_m2", "M2", 17.5, 0, 12),
  quoteRule("材料搬运费", "building_area_m2", "M2", 0, 0, 8),
  quoteRule("垃圾清运费", "building_area_m2", "M2", 0, 0, 10),
  quoteRule("地面砖现场维护费", "building_area_m2", "M2", 0, 3, 5),
  quoteRule("墙面贴瓷砖(600X1200)", "wall_tile_area_m2", "m2", 0, 40, 60),
  quoteRule("墙地面防漏处理", "waterproof_area_m2", "m2", 28, 10.5, 13, WET_FLOOR_SPACE_TYPES),
  quoteRule("窗台石铺贴", "windowsill_length_m", "M", 0, 28, 45),
  quoteRule("砌120厚砖墙", "new_wall_area_m2", "M2", 80, 0, 90),
  quoteRule("拆改及拆墙", "demolition_wall_area_m2", "M2", 0, 0, 60),
  quoteRule("背景墙", "background_wall_area_m2", "M2", 280, 0, 0),
  quoteRule("室内门", "interior_door_count", "樘", 1200, 0, 0),
  quoteRule("卫生间门", "bathroom_door_count", "樘", 1200, 0, 0, BATHROOM_FIXTURE_SPACE_TYPES),
  quoteRule("厨房推拉门", "sliding_door_area_m2", "m2", 550, 0, 0, KITCHEN_CABINET_SPACE_TYPES),
  quoteRule("厨房推拉门双包套", "sliding_door_casing_length_m", "M", 300, 0, 0, KITCHEN_CABINET_SPACE_TYPES),
  quoteRule("橱柜", "kitchen_cabinet_length_m", "M", 600, 0, 0, KITCHEN_CABINET_SPACE_TYPES),
  quoteRule("全屋定制", "custom_cabinet_area_m2", "M2", 600, 0, 0),
  quoteRule("马桶", "toilet_count", "套", 1500, 0, 0, BATHROOM_FIXTURE_SPACE_TYPES),
  quoteRule("浴室柜", "bathroom_vanity_count", "套", 1500, 0, 0, BATHROOM_FIXTURE_SPACE_TYPES),
  quoteRule("花洒", "bathroom_count", "套", 800, 0, 0, BATHROOM_FIXTURE_SPACE_TYPES),
  quoteRule("卫浴五件套", "bathroom_count", "套", 280, 0, 0, BATHROOM_FIXTURE_SPACE_TYPES),
  quoteRule("全屋插座开关", "switch_socket_package_count", "套", 6000, 0, 0),
  quoteRule("全屋灯饰", "lighting_package_count", "套", 15000, 0, 0),
  quoteRule("全屋保洁", "cleaning_package_count", "套", 4500, 0, 0),
  quoteRule("暗窗帘箱", "curtain_wall_width_m", "M", 65, 0, 45, CURTAIN_SPACE_TYPES),
];

const APARTMENT_PENDING_METRICS: PendingQuoteMetric[] = [];

const METRIC_TO_ROW_FIELD: Record<DirectRowQuoteMetric, QuantityRowMetric> = {
  latex_paint_area_m2: "latexPaintAreaM2",
  floor_area_m2: "floorAreaM2",
  ceiling_area_m2: "ceilingAreaM2",
  wall_tile_area_m2: "wallTileAreaM2",
  waterproof_area_m2: "waterproofAreaM2",
  windowsill_length_m: "windowsillLengthM",
  curtain_wall_width_m: "curtainWallWidthM",
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
  wall_tile_piece_count: "wallTileAreaM2",
  electrical_scope_area_m2: "electricalScopeAreaM2",
  plumbing_scope_area_m2: "plumbingScopeAreaM2",
  new_wall_area_m2: "newWallAreaM2",
  demolition_wall_area_m2: "demolitionWallAreaM2",
  background_wall_area_m2: "backgroundWallAreaM2",
  kitchen_cabinet_length_m: "kitchenBaseCabinetLengthM",
};

export function defaultQuoteRules(): QuoteRule[] {
  return DEFAULT_RULES.map((rule) => ({ ...rule, space_types: rule.space_types ? [...rule.space_types] : undefined }));
}

export function updateQuoteRuleUnitPrice(rules: QuoteRule[], index: number, unitPrice: number): QuoteRule[] {
  if (!Number.isInteger(index) || index < 0 || index >= rules.length) {
    throw new Error("报价规则不存在");
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error(`报价规则 unit_price 无效：${String(unitPrice)}`);
  }
  return rules.map((rule, ruleIndex) =>
    ruleIndex === index
      ? { ...rule, unit_price: round2(unitPrice), material_price: round2(unitPrice), auxiliary_price: 0, labor_price: 0 }
      : rule,
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
      unit_price: 110,
      source: row.curtainWallWidthSource as CurtainQuoteCandidate["source"],
      note: "已进入金额汇总",
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
      const quantity = rowRuleQuantity(row, rule);
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

function rowRuleQuantity(row: QuantityRow, rule: QuoteRule & { metric: RowQuoteMetric }): number {
  if (rule.metric === "bathroom_count") {
    return 1;
  }
  return round2(row[METRIC_TO_ROW_FIELD[rule.metric]] ?? 0);
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
  if (rule.metric === "kitchen_cabinet_length_m") {
    return round2(
      billableRows
        .filter((row) => ruleAppliesToRow(rule, row))
        .reduce((sum, row) => sum + row.kitchenBaseCabinetLengthM + row.kitchenWallCabinetLengthM, 0),
    );
  }
  if (isSummedProjectMetric(rule.metric)) {
    if (rule.metric === "wall_tile_piece_count") {
      return round2(
        billableRows
          .filter((row) => ruleAppliesToRow(rule, row))
          .reduce((sum, row) => sum + Math.ceil((row.wallTileAreaM2 * 1.05) / (0.6 * 1.2)), 0),
      );
    }
    const rowField = SUMMED_PROJECT_METRIC_TO_ROW_FIELD[rule.metric];
    return round2(
      billableRows
        .filter((row) => ruleAppliesToRow(rule, row))
        .reduce((sum, row) => sum + (row[rowField] ?? 0), 0),
    );
  }
  return 0;
}

function isProjectMetric(metric: QuoteMetric): metric is ProjectQuoteMetric {
  return (
    metric === "building_area_m2" ||
    metric === "tile_area_m2" ||
    metric === "cleaning_package_count" ||
    metric === "lighting_package_count" ||
    metric === "switch_socket_package_count"
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
    metric === "tile_area_m2" ||
    metric === "cleaning_package_count" ||
    metric === "latex_paint_area_m2" ||
    metric === "floor_area_m2" ||
    metric === "floor_tile_piece_count" ||
    metric === "wall_tile_piece_count" ||
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
    metric === "background_wall_area_m2" ||
    metric === "interior_door_count" ||
    metric === "bathroom_door_count" ||
    metric === "sliding_door_area_m2" ||
    metric === "sliding_door_casing_length_m" ||
    metric === "kitchen_cabinet_length_m" ||
    metric === "kitchen_base_cabinet_length_m" ||
    metric === "kitchen_wall_cabinet_length_m" ||
    metric === "custom_cabinet_area_m2" ||
    metric === "toilet_count" ||
    metric === "bathroom_vanity_count" ||
    metric === "bathroom_count" ||
    metric === "switch_socket_package_count"
  );
}

function ruleAppliesToRow(rule: QuoteRule, row: QuantityRow) {
  if (rule.metric === "curtain_wall_width_m" && !curtainWallWidthIsQuoteReady(row.curtainWallWidthSource)) {
    return false;
  }
  if (rule.metric === "ceiling_area_m2" && KITCHEN_BATHROOM_SPACE_TYPES.includes(row.spaceType)) {
    const finishType = row.ceilingFinishType ?? "integrated";
    if (rule.item_name === "厨房卫生间集成吊顶") {
      return finishType === "integrated";
    }
    if (["轻钢龙骨平顶", "顶面批嵌", "顶面乳胶漆"].includes(rule.item_name)) {
      return finishType === "gypsum";
    }
  }
  return !rule.space_types || rule.space_types.length === 0 || rule.space_types.includes(row.spaceType);
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
): QuoteRule {
  return {
    item_name,
    metric,
    unit,
    unit_price: round2(material_price + auxiliary_price + labor_price),
    material_price,
    auxiliary_price,
    labor_price,
    space_types,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
