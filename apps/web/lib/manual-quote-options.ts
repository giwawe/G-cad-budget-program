import type { QuoteExcelManualItemQuantities } from "./quote-excel";
import type { QuantityRow } from "./types";

export type BathroomManualChoice = {
  fixture?: "马桶" | "蹲坑";
  shower?: "淋浴隔断" | "玻璃淋浴房";
};

const BATHROOM_MANUAL_ITEM_NAMES = new Set(["马桶", "蹲坑", "淋浴隔断", "玻璃淋浴房"]);

export function bathroomChoiceKey(row: QuantityRow): string {
  return `${row.floor}::${row.spaceName}`;
}

export function bathroomRowsFromRows(rows: QuantityRow[]): QuantityRow[] {
  return rows.filter((row) => row.spaceType === "卫生间" && row.status !== "excluded");
}

export function aluminumWindowSuggestedAreaFromRows(rows: QuantityRow[]): number {
  return round2(rows.filter((row) => row.status !== "excluded").reduce((sum, row) => sum + Math.max(row.windowAreaM2, 0), 0));
}

export function manualQuoteQuantitiesFromInputs(inputs: Record<string, string>): QuoteExcelManualItemQuantities {
  return Object.fromEntries(
    Object.entries(inputs)
      .map(([itemName, value]) => [itemName, value.trim() === "" ? undefined : Number(value)] as const)
      .filter((entry): entry is [string, number] => entry[1] !== undefined && Number.isFinite(entry[1]) && entry[1] >= 0)
      .map(([itemName, value]) => [itemName, round2(value)]),
  );
}

export function manualQuoteInputsFromQuantities(quantities: Record<string, number>): Record<string, string> {
  return Object.fromEntries(Object.entries(quantities).map(([itemName, quantity]) => [itemName, String(quantity)]));
}

export function manualQuoteInputsFromBathroomChoices(
  inputs: Record<string, string>,
  choices: Record<string, BathroomManualChoice>,
  bathroomRows: QuantityRow[],
): Record<string, string> {
  const quantities = { 马桶: 0, 蹲坑: 0, 淋浴隔断: 0, 玻璃淋浴房: 0 };
  for (const row of bathroomRows) {
    const choice = choices[bathroomChoiceKey(row)] ?? {};
    quantities[choice.fixture ?? "马桶"] += 1;
    if (choice.shower) {
      quantities[choice.shower] += 1;
    }
  }
  return {
    ...Object.fromEntries(Object.entries(inputs).filter(([itemName]) => !BATHROOM_MANUAL_ITEM_NAMES.has(itemName))),
    ...Object.fromEntries(Object.entries(quantities).map(([itemName, quantity]) => [itemName, String(quantity)])),
  };
}

export function bathroomManualChoicesFromQuantities(quantities: Record<string, number>, bathroomRows: QuantityRow[]): Record<string, BathroomManualChoice> {
  const choices: Record<string, BathroomManualChoice> = {};
  const fixtureQueue = [
    ...Array(Math.max(Math.round(quantities["马桶"] ?? 0), 0)).fill("马桶"),
    ...Array(Math.max(Math.round(quantities["蹲坑"] ?? 0), 0)).fill("蹲坑"),
  ] as Array<"马桶" | "蹲坑">;
  const showerQueue = [
    ...Array(Math.max(Math.round(quantities["淋浴隔断"] ?? 0), 0)).fill("淋浴隔断"),
    ...Array(Math.max(Math.round(quantities["玻璃淋浴房"] ?? 0), 0)).fill("玻璃淋浴房"),
  ] as Array<"淋浴隔断" | "玻璃淋浴房">;
  bathroomRows.forEach((row, index) => {
    const fixture = fixtureQueue[index];
    const shower = showerQueue[index];
    if (fixture || shower) {
      choices[bathroomChoiceKey(row)] = { fixture, shower };
    }
  });
  return choices;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
