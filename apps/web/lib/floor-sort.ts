import type { QuantityRow } from "./types";

const CHINESE_NUMBERS: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

export function sortRowsByFloor<T extends Pick<QuantityRow, "floor">>(rows: T[]): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => compareFloors(left.row.floor, right.row.floor) || left.index - right.index)
    .map((entry) => entry.row);
}

export function compareFloors(left: string, right: string): number {
  return floorSortValue(left) - floorSortValue(right) || left.localeCompare(right, "zh-Hans-CN");
}

export function floorSortValue(floor: string): number {
  const normalized = floor.trim();
  if (!normalized || normalized === "全屋") {
    return Number.MAX_SAFE_INTEGER;
  }
  const digitMatch = normalized.match(/^负?\s*(\d+)\s*[层楼]?$/);
  if (digitMatch) {
    const value = Number(digitMatch[1]);
    return normalized.startsWith("负") ? -value : value;
  }
  const chineseMatch = normalized.match(/^负?\s*([零一二两三四五六七八九十]+)\s*[层楼]?$/);
  if (chineseMatch) {
    const value = chineseNumberValue(chineseMatch[1]);
    return normalized.startsWith("负") ? -value : value;
  }
  return Number.MAX_SAFE_INTEGER - 1;
}

function chineseNumberValue(value: string): number {
  if (value === "十") {
    return 10;
  }
  if (value.includes("十")) {
    const [tensText, onesText] = value.split("十");
    const tens = tensText ? CHINESE_NUMBERS[tensText] ?? 1 : 1;
    const ones = onesText ? CHINESE_NUMBERS[onesText] ?? 0 : 0;
    return tens * 10 + ones;
  }
  return CHINESE_NUMBERS[value] ?? Number.MAX_SAFE_INTEGER - 1;
}
