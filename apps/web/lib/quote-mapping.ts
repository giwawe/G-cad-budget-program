import type { QuantityRow } from "./types";

type QuantityRowMetric =
  | "latexPaintAreaM2"
  | "floorAreaM2"
  | "ceilingAreaM2"
  | "wallTileAreaM2"
  | "waterproofAreaM2"
  | "windowsillLengthM"
  | "curtainWallWidthM"
  | "newWallAreaM2"
  | "demolitionWallAreaM2"
  | "interiorDoorCount"
  | "kitchenCabinetLengthM";
export type QuoteMetric =
  | "latex_paint_area_m2"
  | "floor_area_m2"
  | "ceiling_area_m2"
  | "wall_tile_area_m2"
  | "waterproof_area_m2"
  | "windowsill_length_m"
  | "curtain_wall_width_m"
  | "new_wall_area_m2"
  | "demolition_wall_area_m2"
  | "interior_door_count"
  | "kitchen_cabinet_length_m";

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
    item_count: number;
    total_amount: number;
  };
  curtain_quote_readiness: CurtainQuoteReadiness;
  curtain_quote_candidates: CurtainQuoteCandidate[];
};

export type CurtainQuoteReadiness = {
  ready_count: number;
  pending_count: number;
  ready_space_names: string[];
  pending_space_names: string[];
};

export const DEFAULT_QUOTE_RULES_NAME = "商品房整装默认规则";

const DRY_SPACE_TYPES = ["客厅", "餐厅", "卧室", "书房", "过道", "门厅", "楼梯过道", "衣帽间", "储物间", "露台"];
const CEILING_SPACE_TYPES = ["客厅", "餐厅", "卧室", "书房", "过道", "门厅", "楼梯过道", "衣帽间", "储物间"];
const WET_FLOOR_SPACE_TYPES = ["厨房", "卫生间", "阳台", "露台", "洗衣房"];
const WALL_TILE_SPACE_TYPES = ["厨房", "卫生间", "阳台", "露台", "洗衣房"];
const CURTAIN_SPACE_TYPES = ["客厅", "卧室", "书房"];
const KITCHEN_CABINET_SPACE_TYPES = ["厨房"];

const DEFAULT_RULES: QuoteRule[] = [
  { item_name: "墙面界面剂处理", metric: "latex_paint_area_m2", unit: "m2", unit_price: 7, space_types: DRY_SPACE_TYPES },
  { item_name: "墙面批嵌", metric: "latex_paint_area_m2", unit: "m2", unit_price: 25, space_types: DRY_SPACE_TYPES },
  { item_name: "墙面乳胶漆", metric: "latex_paint_area_m2", unit: "m2", unit_price: 20, space_types: DRY_SPACE_TYPES },
  { item_name: "轻钢龙骨平顶", metric: "ceiling_area_m2", unit: "m2", unit_price: 180, space_types: CEILING_SPACE_TYPES },
  { item_name: "顶面批嵌", metric: "ceiling_area_m2", unit: "m2", unit_price: 25, space_types: DRY_SPACE_TYPES },
  { item_name: "顶面乳胶漆", metric: "ceiling_area_m2", unit: "m2", unit_price: 20, space_types: DRY_SPACE_TYPES },
  { item_name: "地面找平", metric: "floor_area_m2", unit: "m2", unit_price: 56, space_types: WET_FLOOR_SPACE_TYPES },
  { item_name: "地面砖铺贴(750X1500)", metric: "floor_area_m2", unit: "m2", unit_price: 96, space_types: undefined },
  { item_name: "墙面贴瓷砖(600X1200)", metric: "wall_tile_area_m2", unit: "m2", unit_price: 100, space_types: WALL_TILE_SPACE_TYPES },
  { item_name: "墙地面防漏处理", metric: "waterproof_area_m2", unit: "m2", unit_price: 51.5, space_types: WET_FLOOR_SPACE_TYPES },
  { item_name: "窗台石铺贴", metric: "windowsill_length_m", unit: "M", unit_price: 73, space_types: undefined },
  { item_name: "砌120厚砖墙", metric: "new_wall_area_m2", unit: "M2", unit_price: 170, space_types: undefined },
  { item_name: "拆改及拆墙", metric: "demolition_wall_area_m2", unit: "M2", unit_price: 60, space_types: undefined },
  { item_name: "室内门", metric: "interior_door_count", unit: "樘", unit_price: 1200, space_types: undefined },
  { item_name: "橱柜", metric: "kitchen_cabinet_length_m", unit: "M", unit_price: 600, space_types: KITCHEN_CABINET_SPACE_TYPES },
  { item_name: "暗窗帘箱", metric: "curtain_wall_width_m", unit: "M", unit_price: 110, space_types: CURTAIN_SPACE_TYPES },
];

const APARTMENT_PENDING_METRICS: PendingQuoteMetric[] = [
  {
    item_name: "强电布线",
    unit: "M2",
    unit_price: 78,
    reason: "水电通常按套内施工面积、点位或回路规则综合计价，当前缺少点位和回路数据。",
    suggested_metric: "electrical_scope_area_m2",
    source_group: "水电",
  },
  {
    item_name: "水路布管",
    unit: "M2",
    unit_price: 29.5,
    reason: "水路依赖厨房、卫生间、阳台等给排水点位和管线范围，不能直接套现有三类面积。",
    suggested_metric: "plumbing_scope_area_m2",
    source_group: "水电",
  },
  {
    item_name: "马桶",
    unit: "个",
    unit_price: 2500,
    reason: "洁具按设备件数和品牌规格计价，需要点位或选品清单，不能由面积自动推算。",
    suggested_metric: "toilet_count",
    source_group: "洁具",
  },
  {
    item_name: "浴室柜",
    unit: "套",
    unit_price: 3000,
    reason: "浴室柜按套数、长度和规格计价，需要洁具/柜体选型数据。",
    suggested_metric: "bathroom_vanity_count",
    source_group: "洁具",
  },
  {
    item_name: "全屋定制",
    unit: "M2",
    unit_price: 600,
    reason: "定制柜体按展开面积或投影面积计量，需要柜体布置和高度数据。",
    suggested_metric: "custom_cabinet_area_m2",
    source_group: "定制",
  },
  {
    item_name: "地面瓷砖主材",
    unit: "片",
    unit_price: 50,
    reason: "主材按规格、损耗率和采购单位计价，需要从铺贴面积换算到片数并关联选品。",
    suggested_metric: "floor_tile_piece_count",
    source_group: "主材",
  },
  {
    item_name: "全屋灯饰",
    unit: "套",
    unit_price: 6000,
    reason: "套装项按配置包或点位清单计价，当前算量结果没有灯位和套餐配置。",
    suggested_metric: "lighting_package_count",
    source_group: "套装项",
  },
];

const METRIC_TO_ROW_FIELD: Record<QuoteMetric, QuantityRowMetric> = {
  latex_paint_area_m2: "latexPaintAreaM2",
  floor_area_m2: "floorAreaM2",
  ceiling_area_m2: "ceilingAreaM2",
  wall_tile_area_m2: "wallTileAreaM2",
  waterproof_area_m2: "waterproofAreaM2",
  windowsill_length_m: "windowsillLengthM",
  curtain_wall_width_m: "curtainWallWidthM",
  new_wall_area_m2: "newWallAreaM2",
  demolition_wall_area_m2: "demolitionWallAreaM2",
  interior_door_count: "interiorDoorCount",
  kitchen_cabinet_length_m: "kitchenCabinetLengthM",
};

export function defaultQuoteRules(): QuoteRule[] {
  return DEFAULT_RULES.map((rule) => ({ ...rule, space_types: rule.space_types ? [...rule.space_types] : undefined }));
}

export function apartmentPendingQuoteMetrics(): PendingQuoteMetric[] {
  return APARTMENT_PENDING_METRICS.map((item) => ({ ...item }));
}

export function curtainQuoteReadiness(rows: QuantityRow[]): CurtainQuoteReadiness {
  const ready_space_names: string[] = [];
  const pending_space_names: string[] = [];
  for (const row of rows) {
    if (row.status === "excluded") {
      continue;
    }
    if ((row.curtainWallWidthSource === "manual" || row.curtainWallWidthSource === "matched_window_wall") && row.curtainWallWidthM > 0) {
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

export function buildQuoteMapping(rows: QuantityRow[], rules: QuoteRule[] = DEFAULT_RULES): QuoteMapping {
  const billableRows = rows.filter((row) => row.status !== "excluded");
  const items = billableRows.flatMap((row) =>
    rules.filter((rule) => ruleAppliesToRow(rule, row)).map((rule) => {
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

  return {
    items,
    summary: {
      space_count: billableRows.length,
      item_count: items.length,
      total_amount: round2(items.reduce((sum, item) => sum + item.amount, 0)),
    },
    curtain_quote_readiness: curtainQuoteReadiness(rows),
    curtain_quote_candidates: curtainQuoteCandidates(rows),
  };
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
    metric === "latex_paint_area_m2" ||
    metric === "floor_area_m2" ||
    metric === "ceiling_area_m2" ||
    metric === "wall_tile_area_m2" ||
    metric === "waterproof_area_m2" ||
    metric === "windowsill_length_m" ||
    metric === "curtain_wall_width_m" ||
    metric === "new_wall_area_m2" ||
    metric === "demolition_wall_area_m2" ||
    metric === "interior_door_count" ||
    metric === "kitchen_cabinet_length_m"
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
