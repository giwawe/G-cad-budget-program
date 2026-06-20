import type { QuantityRow } from "./types";

type QuantityRowMetric = "latexPaintAreaM2" | "floorAreaM2" | "ceilingAreaM2";
export type QuoteMetric = "latex_paint_area_m2" | "floor_area_m2" | "ceiling_area_m2";

export type QuoteRule = {
  item_name: string;
  metric: QuoteMetric;
  unit: string;
  unit_price: number;
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

export type QuoteMapping = {
  items: QuoteMappingItem[];
  summary: {
    space_count: number;
    item_count: number;
    total_amount: number;
  };
};

const DEFAULT_RULES: QuoteRule[] = [
  { item_name: "墙面乳胶漆", metric: "latex_paint_area_m2", unit: "m2", unit_price: 28 },
  { item_name: "地面铺装", metric: "floor_area_m2", unit: "m2", unit_price: 45 },
  { item_name: "天棚乳胶漆", metric: "ceiling_area_m2", unit: "m2", unit_price: 32 },
];

const METRIC_TO_ROW_FIELD: Record<QuoteMetric, QuantityRowMetric> = {
  latex_paint_area_m2: "latexPaintAreaM2",
  floor_area_m2: "floorAreaM2",
  ceiling_area_m2: "ceilingAreaM2",
};

export function defaultQuoteRules(): QuoteRule[] {
  return DEFAULT_RULES.map((rule) => ({ ...rule }));
}

export function buildQuoteMapping(rows: QuantityRow[], rules: QuoteRule[] = DEFAULT_RULES): QuoteMapping {
  const billableRows = rows.filter((row) => row.status !== "excluded");
  const items = billableRows.flatMap((row) =>
    rules.map((rule) => {
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
  if (candidate.metric !== "latex_paint_area_m2" && candidate.metric !== "floor_area_m2" && candidate.metric !== "ceiling_area_m2") {
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
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
