import type { QuantityRow } from "./types";

type QuoteMetric = "latexPaintAreaM2" | "floorAreaM2" | "ceilingAreaM2";

type QuoteRule = {
  itemName: string;
  metric: QuoteMetric;
  unit: string;
  unitPrice: number;
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
  { itemName: "墙面乳胶漆", metric: "latexPaintAreaM2", unit: "m2", unitPrice: 28 },
  { itemName: "地面铺装", metric: "floorAreaM2", unit: "m2", unitPrice: 45 },
  { itemName: "天棚乳胶漆", metric: "ceilingAreaM2", unit: "m2", unitPrice: 32 },
];

export function buildQuoteMapping(rows: QuantityRow[]): QuoteMapping {
  const billableRows = rows.filter((row) => row.status !== "excluded");
  const items = billableRows.flatMap((row) =>
    DEFAULT_RULES.map((rule) => {
      const quantity = round2(row[rule.metric]);
      return {
        floor: row.floor,
        space_name: row.spaceName,
        space_type: row.spaceType,
        item_name: rule.itemName,
        quantity,
        unit: rule.unit,
        unit_price: rule.unitPrice,
        amount: round2(quantity * rule.unitPrice),
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

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
