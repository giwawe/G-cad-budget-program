import type { QuantityRow, ReviewStatus } from "./types";

const FULL_WALL_TILE_SPACE_TYPES = new Set(["厨房", "卫生间"]);
const DEFAULT_DOOR_HEIGHT_M = 2.1;

export function updateQuantityRowStatus(rows: QuantityRow[], spaceName: string, status: ReviewStatus): QuantityRow[] {
  return rows.map((row) => (row.spaceName === spaceName ? { ...row, status } : row));
}

export function updateQuantityRowsStatusBySpaceNames(rows: QuantityRow[], spaceNames: string[], status: ReviewStatus): QuantityRow[] {
  const names = new Set(spaceNames);
  return rows.map((row) => (names.has(row.spaceName) ? { ...row, status } : row));
}

export function confirmQuantityRowsBySpaceNames(rows: QuantityRow[], spaceNames: string[]): QuantityRow[] {
  return updateQuantityRowsStatusBySpaceNames(rows, spaceNames, "confirmed");
}

export function updateQuantityRowCurtainWallWidth(rows: QuantityRow[], spaceName: string, widthM: number): QuantityRow[] {
  const curtainWallWidthM = Math.round(Math.max(widthM, 0) * 100) / 100;
  return rows.map((row) => (row.spaceName === spaceName ? { ...row, curtainWallWidthM, curtainWallWidthSource: "manual" } : row));
}

export function updateQuantityRowSpaceType(rows: QuantityRow[], spaceName: string, spaceType: string): QuantityRow[] {
  const nextSpaceType = spaceType.trim();
  if (!nextSpaceType) {
    return rows;
  }
  return rows.map((row) => (row.spaceName === spaceName ? recalculateRowForSpaceType(row, nextSpaceType) : row));
}

function recalculateRowForSpaceType(row: QuantityRow, spaceType: string): QuantityRow {
  const wallTileAreaM2 = calculateWallTileArea({ ...row, spaceType });
  const latexPaintBaseAreaM2 = round2((row.wallMeasureLengthM + row.doorWidthTotalM) * row.heightM);
  const latexPaintAreaM2 = calculateLatexPaintArea(spaceType, latexPaintBaseAreaM2, row.windowAreaM2, row.doorDeductAreaM2, wallTileAreaM2);
  return {
    ...row,
    spaceType,
    ceilingFinishType: defaultCeilingFinishType(spaceType),
    wallTileAreaM2,
    latexPaintAreaM2,
    evidence: appendEvidence(row.evidence, `人工调整空间类型为 ${spaceType}`),
  };
}

function calculateWallTileArea(row: QuantityRow) {
  if (FULL_WALL_TILE_SPACE_TYPES.has(row.spaceType)) {
    return round2(Math.max(row.wallMeasureLengthM * 2.5 - row.windowAreaM2 - row.doorWidthTotalM * DEFAULT_DOOR_HEIGHT_M, 0));
  }
  if (row.wallTileMeasureLengthM > 0) {
    return round2(Math.max(row.wallTileMeasureLengthM * row.heightM, 0));
  }
  return 0;
}

function calculateLatexPaintArea(spaceType: string, latexPaintBaseAreaM2: number, windowAreaM2: number, doorDeductAreaM2: number, wallTileAreaM2: number) {
  if (FULL_WALL_TILE_SPACE_TYPES.has(spaceType) && wallTileAreaM2 > 0) {
    return 0;
  }
  return round2(Math.max(latexPaintBaseAreaM2 - windowAreaM2 - doorDeductAreaM2 - wallTileAreaM2, 0));
}

function defaultCeilingFinishType(spaceType: string): QuantityRow["ceilingFinishType"] {
  return FULL_WALL_TILE_SPACE_TYPES.has(spaceType) ? "integrated" : "gypsum";
}

function appendEvidence(evidence: string, note: string) {
  return evidence.trim() ? `${evidence}；${note}` : note;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
