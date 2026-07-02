import type { QuoteExcelManualItemQuantities } from "./quote-excel";
import type { QuantityRow } from "./types";

export function bathroomCountFromRows(rows: QuantityRow[]): number {
  return rows.filter((row) => row.spaceType === "卫生间" && row.status !== "excluded").length;
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

export function applyExclusiveManualQuoteChoice(
  inputs: Record<string, string>,
  groupItemNames: string[],
  selectedItemName: string,
  suggestedQuantity: number,
): Record<string, string> {
  const quantity = String(round2(Math.max(Number.isFinite(suggestedQuantity) ? suggestedQuantity : 0, 0)));
  return {
    ...inputs,
    ...Object.fromEntries(groupItemNames.map((itemName) => [itemName, itemName === selectedItemName ? quantity : "0"])),
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
