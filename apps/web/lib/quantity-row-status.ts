import type { QuantityRow, ReviewStatus } from "./types";

export function updateQuantityRowStatus(rows: QuantityRow[], spaceName: string, status: ReviewStatus): QuantityRow[] {
  return rows.map((row) => (row.spaceName === spaceName ? { ...row, status } : row));
}

export function updateQuantityRowCurtainWallWidth(rows: QuantityRow[], spaceName: string, widthM: number): QuantityRow[] {
  const curtainWallWidthM = Math.round(Math.max(widthM, 0) * 100) / 100;
  return rows.map((row) => (row.spaceName === spaceName ? { ...row, curtainWallWidthM, curtainWallWidthSource: "manual" } : row));
}
