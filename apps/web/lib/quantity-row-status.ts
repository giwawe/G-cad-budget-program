import type { QuantityRow, ReviewStatus } from "./types";

export function updateQuantityRowStatus(rows: QuantityRow[], spaceName: string, status: ReviewStatus): QuantityRow[] {
  return rows.map((row) => (row.spaceName === spaceName ? { ...row, status } : row));
}
