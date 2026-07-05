import assert from "node:assert/strict";
import { sortRowsByFloor } from "./floor-sort.ts";
import type { QuantityRow } from "./types.ts";

const row = (floor: string, spaceName: string) => ({ floor, spaceName }) as QuantityRow;

const sorted = sortRowsByFloor([
  row("三层", "露台"),
  row("负一层", "楼梯间"),
  row("一层", "客厅"),
  row("负二层", "储藏间"),
  row("二层", "主卧"),
]);

assert.deepEqual(sorted.map((item) => `${item.floor}-${item.spaceName}`), [
  "负二层-储藏间",
  "负一层-楼梯间",
  "一层-客厅",
  "二层-主卧",
  "三层-露台",
]);
